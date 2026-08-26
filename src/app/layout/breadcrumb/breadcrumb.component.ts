import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Breadcrumb, BreadcrumbService } from '../../core/services/breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent {
  readonly breadcrumbs$: Observable<Breadcrumb[]>;

  constructor(breadcrumbService: BreadcrumbService) {
    this.breadcrumbs$ = breadcrumbService.breadcrumbs();
  }
}
