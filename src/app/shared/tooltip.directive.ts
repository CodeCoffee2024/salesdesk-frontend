import { Directive, ElementRef, HostListener, Input, OnDestroy } from '@angular/core';

const HOVER_SHOW_DELAY_MS = 300;
const LONG_PRESS_MS = 500;
const VIEWPORT_MARGIN_PX = 8;
const GAP_PX = 8;

/**
 * Tooltip for icon-only controls, truncated values, and status badges
 * (TASK-041): `<button appTooltip="Row actions">&hellip;</button>`.
 *
 * Shows on hover (after a short delay, to avoid flicker on a fast mouse pass)
 * and on keyboard focus. On touch there's no hover event to rely on, so only a
 * tap-and-hold (long press) reveals it — a quick tap is left alone so the
 * control's normal action (e.g. opening a kebab menu) still fires; the
 * synthetic click that follows a long press is suppressed so it doesn't *also*
 * fire that action right under the tooltip the user was just trying to read.
 *
 * The bubble is appended to document.body with `position: fixed` rather than
 * living in this directive's own component view, so it's never clipped by an
 * ancestor's `overflow: hidden` (e.g. a table's horizontal scroll wrapper) —
 * see the global `.sd-tooltip-bubble` styles in styles.scss, which is why this
 * directive has no styleUrls of its own. It dismisses on outside tap/scroll and
 * never overlaps the control it describes (positioned above or below it, never
 * on top), so it can't block the next tap target.
 */
@Directive({
  selector: '[appTooltip]'
})
export class TooltipDirective implements OnDestroy {
  @Input('appTooltip') text = '';

  /** Only show when the host's own content is actually clipped (e.g. a `text-overflow: ellipsis` cell) — set this on truncated-value targets so a value short enough to fit doesn't get a redundant tooltip. */
  @Input() appTooltipOnlyIfTruncated = false;

  private bubble: HTMLElement | null = null;
  private hoverTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressTriggered = false;

  private readonly onOutsideInteraction = (event: Event): void => {
    if (event.target instanceof Node && this.elementRef.nativeElement.contains(event.target)) {
      return;
    }
    this.hide();
  };

  private readonly onScroll = (): void => this.hide();

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.clearHoverTimer();
    this.hoverTimer = setTimeout(() => this.show(), HOVER_SHOW_DELAY_MS);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.clearHoverTimer();
    this.hide();
  }

  @HostListener('focus')
  onFocus(): void {
    this.show();
  }

  @HostListener('blur')
  onBlur(): void {
    this.hide();
  }

  @HostListener('touchstart')
  onTouchStart(): void {
    this.longPressTriggered = false;
    this.clearLongPressTimer();
    this.longPressTimer = setTimeout(() => {
      this.longPressTriggered = true;
      this.show();
    }, LONG_PRESS_MS);
  }

  @HostListener('touchmove')
  @HostListener('touchcancel')
  onTouchInterrupted(): void {
    this.clearLongPressTimer();
  }

  @HostListener('touchend')
  onTouchEnd(): void {
    this.clearLongPressTimer();
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.longPressTriggered) {
      event.preventDefault();
      event.stopPropagation();
      this.longPressTriggered = false;
      this.hide();
    }
  }

  ngOnDestroy(): void {
    this.clearHoverTimer();
    this.clearLongPressTimer();
    this.hide();
  }

  private show(): void {
    if (!this.text || this.bubble) {
      return;
    }

    if (this.appTooltipOnlyIfTruncated) {
      const el = this.elementRef.nativeElement;
      if (el.scrollWidth <= el.clientWidth) {
        return;
      }
    }

    const bubble = document.createElement('span');
    bubble.className = 'sd-tooltip-bubble';
    bubble.setAttribute('role', 'tooltip');
    bubble.textContent = this.text;
    document.body.appendChild(bubble);
    this.bubble = bubble;

    this.position();
    // Next frame so the opacity/transform transition (set up already-in-DOM, per
    // the class toggle) actually animates instead of snapping in.
    requestAnimationFrame(() => bubble.classList.add('sd-tooltip-bubble--visible'));

    document.addEventListener('touchstart', this.onOutsideInteraction, true);
    document.addEventListener('click', this.onOutsideInteraction, true);
    window.addEventListener('scroll', this.onScroll, true);
  }

  private hide(): void {
    if (!this.bubble) {
      return;
    }

    this.bubble.remove();
    this.bubble = null;
    document.removeEventListener('touchstart', this.onOutsideInteraction, true);
    document.removeEventListener('click', this.onOutsideInteraction, true);
    window.removeEventListener('scroll', this.onScroll, true);
  }

  private position(): void {
    if (!this.bubble) {
      return;
    }

    const hostRect = this.elementRef.nativeElement.getBoundingClientRect();
    const bubbleRect = this.bubble.getBoundingClientRect();

    let top = hostRect.top - bubbleRect.height - GAP_PX;
    if (top < VIEWPORT_MARGIN_PX) {
      top = hostRect.bottom + GAP_PX;
    }

    let left = hostRect.left + hostRect.width / 2 - bubbleRect.width / 2;
    left = Math.max(VIEWPORT_MARGIN_PX, Math.min(left, window.innerWidth - bubbleRect.width - VIEWPORT_MARGIN_PX));

    this.bubble.style.top = `${top}px`;
    this.bubble.style.left = `${left}px`;
  }

  private clearHoverTimer(): void {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }
}
