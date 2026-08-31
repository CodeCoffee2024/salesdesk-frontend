import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { driver, Driver } from 'driver.js';

interface TourStep {
  /** Only navigated to if we're not already there — every step targets an element that exists for a brand-new account with zero data, since onboarding runs before any customers/products/documents exist. */
  route?: string;
  element: string;
  title: string;
  description: string;
}

const STEPS: TourStep[] = [
  {
    route: '/overview',
    element: 'a[href="/documents"]',
    title: 'Your documents live here',
    description: "Every quote and invoice you create shows up in this list, with its status and a shareable client link."
  },
  {
    route: '/documents',
    element: '.documents-page__new-button',
    title: 'Start a new quote or invoice',
    description:
      "Click here whenever you're ready to draft one. Once it's sent, you can change its status or copy a public link for your client from the same row."
  },
  {
    route: '/documents/new',
    element: '.line-item-row__description',
    title: 'Catalog autocomplete',
    description: "Start typing a product name here and we'll suggest matches from your catalog, filling in the price automatically."
  },
  {
    route: '/documents/new',
    element: '.document-preview-pane',
    title: 'Live preview',
    description: "This updates as you type, so you always see exactly what your client will see before you send anything."
  },
  {
    route: '/templates',
    element: 'a[href="/templates"]',
    title: 'Customize your templates',
    description:
      'Templates control your branding and layout, and support merge tags like {{Customer.Name}} that fill in automatically for every document.'
  }
];

/**
 * Wraps Driver.js to drive a guided tour across multiple routes (TASK-029) —
 * Driver.js itself only knows how to highlight elements already on the current
 * page, so each step's Next/Back button is wired to navigate first (when needed)
 * and re-highlight, rather than using Driver's own sequential .drive() flow.
 */
@Injectable({
  providedIn: 'root'
})
export class TourService {
  private driverObj?: Driver;

  constructor(private readonly router: Router) {}

  start(): void {
    this.driverObj = driver({ animate: true, overlayOpacity: 0.55 });
    void this.showStep(0);
  }

  stop(): void {
    this.driverObj?.destroy();
  }

  private async showStep(index: number): Promise<void> {
    const step = STEPS[index];
    if (!step || !this.driverObj) {
      return;
    }

    if (step.route && !this.router.url.startsWith(step.route)) {
      await this.router.navigateByUrl(step.route);
      // Give Angular a beat to render the new route before Driver.js looks for the element.
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const isFirst = index === 0;
    const isLast = index === STEPS.length - 1;

    this.driverObj.highlight({
      element: step.element,
      waitForElement: 2000,
      popover: {
        title: step.title,
        description: step.description,
        showButtons: [...(isFirst ? [] : (['previous'] as const)), 'next', 'close'],
        nextBtnText: isLast ? 'Done' : 'Next',
        onNextClick: () => (isLast ? this.driverObj?.destroy() : void this.showStep(index + 1)),
        onPrevClick: () => void this.showStep(index - 1),
        onCloseClick: () => this.driverObj?.destroy()
      }
    });
  }
}
