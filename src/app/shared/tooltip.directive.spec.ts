import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { TooltipDirective } from './tooltip.directive';

@Component({
  template: `<button appTooltip="Row actions">&hellip;</button>`
})
class HostComponent {}

function getBubble(): HTMLElement | null {
  return document.querySelector('.sd-tooltip-bubble');
}

describe('TooltipDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HostComponent, TooltipDirective]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button');
  });

  afterEach(() => {
    // A leftover bubble (a test that showed one but didn't destroy the fixture) would bleed into the next test's DOM query.
    getBubble()?.remove();
  });

  it('does not show a bubble immediately on mouseenter (waits out the hover delay)', () => {
    button.dispatchEvent(new MouseEvent('mouseenter'));
    expect(getBubble()).toBeNull();
  });

  it('shows the tooltip text after the hover delay', fakeAsync(() => {
    button.dispatchEvent(new MouseEvent('mouseenter'));
    tick(300);

    const bubble = getBubble();
    expect(bubble).not.toBeNull();
    expect(bubble?.textContent).toBe('Row actions');
  }));

  it('cancels the pending show if the pointer leaves before the delay elapses', fakeAsync(() => {
    button.dispatchEvent(new MouseEvent('mouseenter'));
    tick(100);
    button.dispatchEvent(new MouseEvent('mouseleave'));
    tick(300);

    expect(getBubble()).toBeNull();
  }));

  it('hides on mouseleave once shown', fakeAsync(() => {
    button.dispatchEvent(new MouseEvent('mouseenter'));
    tick(300);
    expect(getBubble()).not.toBeNull();

    button.dispatchEvent(new MouseEvent('mouseleave'));
    expect(getBubble()).toBeNull();
  }));

  it('does not show on a quick tap (touchstart immediately followed by touchend)', fakeAsync(() => {
    button.dispatchEvent(new Event('touchstart'));
    tick(100);
    button.dispatchEvent(new Event('touchend'));
    tick(500);

    expect(getBubble()).toBeNull();
  }));

  it('shows on a tap-and-hold past the long-press threshold', fakeAsync(() => {
    button.dispatchEvent(new Event('touchstart'));
    tick(500);

    expect(getBubble()?.textContent).toBe('Row actions');
  }));

  it('suppresses the click that follows a long press, so the button action does not also fire', fakeAsync(() => {
    let clicked = false;
    button.addEventListener('click', () => (clicked = true));

    button.dispatchEvent(new Event('touchstart'));
    tick(500);
    const clickEvent = new MouseEvent('click', { cancelable: true });
    button.dispatchEvent(clickEvent);

    expect(clickEvent.defaultPrevented).toBeTrue();
  }));

  it('hides on an outside click', fakeAsync(() => {
    button.dispatchEvent(new MouseEvent('mouseenter'));
    tick(300);
    expect(getBubble()).not.toBeNull();

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(getBubble()).toBeNull();
  }));

  it('hides on scroll', fakeAsync(() => {
    button.dispatchEvent(new MouseEvent('mouseenter'));
    tick(300);
    expect(getBubble()).not.toBeNull();

    window.dispatchEvent(new Event('scroll'));

    expect(getBubble()).toBeNull();
  }));
});
