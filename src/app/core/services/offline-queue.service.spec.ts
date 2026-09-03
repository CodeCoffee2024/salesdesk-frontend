import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { OfflineQueueService } from './offline-queue.service';
import { DocumentService } from './document.service';
import { offlineDb } from '../offline/offline-db';
import { CreateDocumentRequest, Document as DocumentModel } from '../models/document.model';

const request: CreateDocumentRequest = {
  type: 'Quote',
  customerId: 'cust-1',
  templateId: 'tpl-1',
  dueDate: '2026-09-15',
  lineItems: [{ description: 'Research', quantity: 1, unitPrice: 500, productId: null }]
};

function makeDocument(): DocumentModel {
  return {
    id: 'doc-1',
    publicToken: 'pub-1',
    isLocked: false,
    isDispatched: false,
    dispatchedAt: null,
    signature: null,
    documentNumber: 'QUO-1',
    type: 'Quote',
    status: 'Draft',
    issueDate: '2026-09-01',
    dueDate: '2026-09-15',
    customerId: 'cust-1',
    customerName: 'Maya Chen',
    customerCompany: 'Northstar Studio',
    templateId: 'tpl-1',
    templateName: 'Studio Standard',
    subtotal: 500,
    total: 500,
    currency: 'USD',
    clientCountry: null,
    lineItems: [{ id: 'li-1', productId: null, description: 'Research', quantity: 1, unitPrice: 500, lineTotal: 500 }],
    activities: []
  };
}

describe('OfflineQueueService', () => {
  let service: OfflineQueueService;
  let documentServiceSpy: jasmine.SpyObj<DocumentService>;

  beforeEach(async () => {
    await offlineDb.pendingDocuments.clear();
    await offlineDb.authToken.clear();

    documentServiceSpy = jasmine.createSpyObj('DocumentService', ['create']);
    documentServiceSpy.create.and.returnValue(of(makeDocument()));

    TestBed.configureTestingModule({
      providers: [{ provide: DocumentService, useValue: documentServiceSpy }]
    });

    service = TestBed.inject(OfflineQueueService);
    // The constructor's own online-triggered flush races the DB clear above —
    // give it a tick to settle before each test starts from a known-empty queue.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await offlineDb.pendingDocuments.clear();
  });

  afterEach(async () => {
    await offlineDb.pendingDocuments.clear();
    await offlineDb.authToken.clear();
  });

  it('enqueues a pending document and reflects it in pendingCount$', async () => {
    let latestCount = -1;
    service.pendingCount$.subscribe((count) => (latestCount = count));

    await service.enqueue(request);

    expect(latestCount).toBe(1);
    const pending = await service.getPending();
    expect(pending.length).toBe(1);
    expect(pending[0].payload).toEqual(request);
    expect(pending[0].status).toBe('pending');
  });

  it('flushPending posts queued documents and removes them on success', async () => {
    await service.enqueue(request);

    await service.flushPending();

    expect(documentServiceSpy.create).toHaveBeenCalledWith(request);
    expect(await service.getPending()).toEqual([]);
  });

  it('flushPending marks an item failed (and keeps it queued) if the API call fails', async () => {
    documentServiceSpy.create.and.returnValue(throwError(() => new Error('down')));
    await service.enqueue(request);

    await service.flushPending();

    const pending = await service.getPending();
    expect(pending.length).toBe(1);
    expect(pending[0].status).toBe('failed');
  });

  it('retry resets a failed item to pending and attempts to flush it again', async () => {
    documentServiceSpy.create.and.returnValue(throwError(() => new Error('down')));
    await service.enqueue(request);
    await service.flushPending();
    const [failed] = await service.getPending();

    documentServiceSpy.create.and.returnValue(of(makeDocument()));
    await service.retry(failed.id as number);

    expect(await service.getPending()).toEqual([]);
  });

  it('discard removes a pending item without attempting to sync it', async () => {
    await service.enqueue(request);
    const [item] = await service.getPending();

    await service.discard(item.id as number);

    expect(documentServiceSpy.create).not.toHaveBeenCalled();
    expect(await service.getPending()).toEqual([]);
  });
});
