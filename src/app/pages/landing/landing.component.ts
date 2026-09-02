import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from '../../core/services/analytics.service';

type PreviewDocType = 'Quote' | 'Invoice';

interface PreviewLineItem {
  description: string;
  amount: string;
}

interface FeatureHighlight {
  id: string;
  label: string;
  title: string;
  description: string;
}

interface PricingPlan {
  name: string;
  price: string;
  cadence: string;
  description: string;
  quota: string;
  features: string[];
  highlighted: boolean;
}

/**
 * Public marketing page served at "/" for unauthenticated visitors (TASK-018).
 * homeGuard keeps an already-authenticated visitor from ever landing here — see
 * app-routing.module.ts.
 */
@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  readonly previewDocTypes: PreviewDocType[] = ['Quote', 'Invoice'];
  activePreviewDocType: PreviewDocType = 'Quote';

  // TASK-032: sample data reflects the "event pros" ICP (weddings, corporate gigs) —
  // matches the hero headline/pitch directly above this preview card.
  private readonly previewLineItems: Record<PreviewDocType, PreviewLineItem[]> = {
    Quote: [
      { description: 'Wedding MC & DJ package (6 hrs)', amount: '$1,800.00' },
      { description: 'Corporate event hosting (half-day)', amount: '$950.00' }
    ],
    Invoice: [
      { description: 'Booking deposit, Saturday wedding', amount: '$500.00' },
      { description: 'Final balance, reception hosting', amount: '$1,300.00' }
    ]
  };

  private readonly previewNumbers: Record<PreviewDocType, string> = {
    Quote: 'QUO-2026-041',
    Invoice: 'INV-2026-018'
  };

  readonly features: FeatureHighlight[] = [
    {
      id: 'documents',
      label: 'Multi-line documents',
      title: 'Build quotes and invoices line by line',
      description: 'Add products, services, and one-off line items, with subtotals and totals calculated as you type.'
    },
    {
      id: 'catalog',
      label: 'Catalog integration',
      title: 'A living catalog of what you sell',
      description: 'Save products and services once, then drop them into any document with pricing already filled in.'
    },
    {
      id: 'pdf',
      label: 'PDF export',
      title: 'Client-ready PDFs in one click',
      description: 'Every quote and invoice exports to a polished, branded PDF your clients can open anywhere.'
    },
    {
      id: 'templates',
      label: 'Custom templates',
      title: 'Templates that match your studio',
      description: 'Choose a layout and accent color once, and every document you send carries your look.'
    }
  ];

  activeFeatureId = this.features[0].id;

  readonly plans: PricingPlan[] = [
    {
      name: 'Starter',
      price: 'Free',
      cadence: '',
      description: 'For freelancers just getting started.',
      quota: '10 documents / month',
      features: ['1 workspace user', '10 documents per month', 'PDF export', 'Studio Standard template'],
      highlighted: false
    },
    {
      name: 'Studio',
      price: '$24',
      cadence: '/ month',
      description: 'For small studios billing clients regularly.',
      quota: '100 documents / month',
      features: ['Up to 5 workspace users', '100 documents per month', 'Custom templates', 'Priority support'],
      highlighted: true
    },
    {
      name: 'Agency',
      price: '$59',
      cadence: '/ month',
      description: 'For agencies managing many clients at once.',
      quota: 'Unlimited documents',
      features: ['Unlimited workspace users', 'Unlimited documents', 'Role-based permissions', 'Dedicated support'],
      highlighted: false
    }
  ];

  constructor(private readonly analytics: AnalyticsService) {}

  // First step of the marketing funnel (TASK-032 / docs/research/TASK-DAY-BY-DAY-MARKET.md):
  // a distinctly-named GA4 event, separate from the automatic page_view
  // AnalyticsService already fires on every route change, so a Funnel
  // Exploration can be built against landing_view -> signup_started ->
  // first_quote_sent without conflating it with any other page view.
  ngOnInit(): void {
    this.analytics.trackEvent('landing_view');
  }

  get activeFeature(): FeatureHighlight {
    return this.features.find(feature => feature.id === this.activeFeatureId) ?? this.features[0];
  }

  get activePreviewLineItems(): PreviewLineItem[] {
    return this.previewLineItems[this.activePreviewDocType];
  }

  get activePreviewNumber(): string {
    return this.previewNumbers[this.activePreviewDocType];
  }

  get activePreviewTotal(): string {
    const total = this.activePreviewLineItems.reduce((sum, item) => sum + Number(item.amount.replace(/[^0-9.]/g, '')), 0);
    return total.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  selectPreviewDocType(type: PreviewDocType): void {
    this.activePreviewDocType = type;
  }

  selectFeature(id: string): void {
    this.activeFeatureId = id;
  }
}
