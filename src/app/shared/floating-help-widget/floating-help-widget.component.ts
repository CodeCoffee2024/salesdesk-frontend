import { Component } from '@angular/core';
import { TourService } from '../../core/services/tour.service';

interface FaqEntry {
  question: string;
  answer: string;
}

const FAQ: FaqEntry[] = [
  {
    question: 'How do clients accept and e-sign a document?',
    answer:
      'Every document gets a public link (visible on its preview page). Your client opens it, reviews the quote or invoice, and can draw or type their signature. No account needed on their end.'
  },
  {
    question: 'How do I set up my template colors and branding?',
    answer:
      'Open Templates, pick or create one, and use the accent color picker plus the rich-text editor to match your studio\'s look. Changes preview live as you edit.'
  },
  {
    question: 'What are merge tags like {{Customer.Name}}?',
    answer:
      "Placeholders you drop into a template's content. They're automatically replaced with each document's real customer/quote details when it's sent, so one template works for every client."
  },
  {
    question: 'Can I get notified when a client views or signs a document?',
    answer: 'Yes: turn on the bell icon in the top bar to get a browser notification the moment a client views, signs, or requests changes.'
  },
  {
    question: "What happens if I lose connection while working?",
    answer: "Creating a document while offline saves it on your device automatically and syncs the moment you're back online. Nothing is lost."
  }
];

/**
 * Persistent "?" help button in the bottom-right corner of the authenticated
 * app shell (TASK-029) — quick links plus a small, client-side-searched FAQ.
 * Deliberately not a full help-center/CMS integration: a fixed list is enough
 * for what the task actually asks for (a few named topics + inline search).
 */
@Component({
  selector: 'app-floating-help-widget',
  templateUrl: './floating-help-widget.component.html',
  styleUrls: ['./floating-help-widget.component.scss']
})
export class FloatingHelpWidgetComponent {
  open = false;
  searchTerm = '';
  readonly faq = FAQ;

  constructor(private readonly tourService: TourService) {}

  get filteredFaq(): FaqEntry[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.faq;
    }

    return this.faq.filter((entry) => entry.question.toLowerCase().includes(term) || entry.answer.toLowerCase().includes(term));
  }

  toggle(): void {
    this.open = !this.open;
  }

  restartTour(): void {
    this.open = false;
    this.tourService.start();
  }

  /** "Quick link" buttons jump straight to the matching FAQ answer rather than a separate article page — there's no standalone help-article system, and the answer already lives right here. */
  jumpToFaq(searchTerm: string): void {
    this.searchTerm = searchTerm;
  }
}
