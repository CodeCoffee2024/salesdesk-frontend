import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkeletonLineComponent } from './skeleton-line.component';
import { SkeletonRowComponent } from './skeleton-row.component';
import { SkeletonCardComponent } from './skeleton-card.component';
import { SkeletonChartComponent } from './skeleton-chart.component';
import { SkeletonListComponent } from './skeleton-list.component';

describe('Skeleton primitives', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SkeletonLineComponent, SkeletonRowComponent, SkeletonCardComponent, SkeletonChartComponent, SkeletonListComponent]
    }).compileComponents();
  });

  it('SkeletonLineComponent applies the given width/height to the shimmer element', () => {
    const fixture: ComponentFixture<SkeletonLineComponent> = TestBed.createComponent(SkeletonLineComponent);
    fixture.componentInstance.width = '40%';
    fixture.componentInstance.height = '20px';
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement.querySelector('.sd-skeleton');
    expect(el.style.width).toBe('40%');
    expect(el.style.height).toBe('20px');
  });

  it('SkeletonRowComponent renders one cell per column', () => {
    const fixture: ComponentFixture<SkeletonRowComponent> = TestBed.createComponent(SkeletonRowComponent);
    fixture.componentInstance.columns = 5;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.skeleton-row__cell').length).toBe(5);
  });

  it('SkeletonCardComponent renders a title line plus the requested body lines', () => {
    const fixture: ComponentFixture<SkeletonCardComponent> = TestBed.createComponent(SkeletonCardComponent);
    fixture.componentInstance.lines = 3;
    fixture.detectChanges();

    // 1 title line + 3 body lines
    expect(fixture.nativeElement.querySelectorAll('app-skeleton-line').length).toBe(4);
  });

  it('SkeletonChartComponent renders the requested number of bars', () => {
    const fixture: ComponentFixture<SkeletonChartComponent> = TestBed.createComponent(SkeletonChartComponent);
    fixture.componentInstance.bars = 4;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.skeleton-chart__bar').length).toBe(4);
  });

  it('SkeletonListComponent repeats rows by default', () => {
    const fixture: ComponentFixture<SkeletonListComponent> = TestBed.createComponent(SkeletonListComponent);
    fixture.componentInstance.count = 6;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-skeleton-row').length).toBe(6);
    expect(fixture.nativeElement.querySelectorAll('app-skeleton-card').length).toBe(0);
  });

  it('SkeletonListComponent repeats cards when type is "card"', () => {
    const fixture: ComponentFixture<SkeletonListComponent> = TestBed.createComponent(SkeletonListComponent);
    fixture.componentInstance.type = 'card';
    fixture.componentInstance.count = 3;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-skeleton-card').length).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('app-skeleton-row').length).toBe(0);
  });
});
