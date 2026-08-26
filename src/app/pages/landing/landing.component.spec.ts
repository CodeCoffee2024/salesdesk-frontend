import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let fixture: ComponentFixture<LandingComponent>;
  let component: LandingComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [LandingComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('every CTA routes to a functional auth page, never a placeholder', () => {
    const links: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('a[routerLink]'));
    expect(links.length).toBeGreaterThan(0);

    links.forEach(link => {
      const target = link.getAttribute('href') ?? '';
      expect(['/login', '/register']).toContain(target);
    });
  });

  it('switches the live-preview document type when a tab is clicked', () => {
    expect(component.activePreviewDocType).toBe('Quote');

    const invoiceTab: HTMLButtonElement = Array.from(fixture.nativeElement.querySelectorAll('.preview-card__tab')).find(
      (el: any) => el.textContent.trim() === 'Invoice'
    ) as HTMLButtonElement;
    invoiceTab.click();
    fixture.detectChanges();

    expect(component.activePreviewDocType).toBe('Invoice');
    expect(fixture.nativeElement.querySelector('.preview-card__number').textContent).toContain('INV-');
  });

  it('switches the active feature panel when a feature tab is clicked', () => {
    const firstFeatureId = component.features[0].id;
    const secondFeature = component.features[1];
    expect(component.activeFeatureId).toBe(firstFeatureId);

    component.selectFeature(secondFeature.id);
    fixture.detectChanges();

    expect(component.activeFeature.title).toBe(secondFeature.title);
    expect(fixture.nativeElement.querySelector('.features__panel h3').textContent).toContain(secondFeature.title);
  });

  it('renders all three pricing tiers with a Start free trial CTA each', () => {
    const planCards = fixture.nativeElement.querySelectorAll('.plan-card');
    expect(planCards.length).toBe(component.plans.length);

    planCards.forEach((card: HTMLElement) => {
      const cta = card.querySelector('a[routerLink]');
      expect(cta?.getAttribute('href')).toBe('/register');
    });
  });
});
