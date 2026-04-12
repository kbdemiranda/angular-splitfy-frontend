import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardService],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests KPIs with reference month when provided', async () => {
    const promise = firstValueFrom(service.getKpis('2026-04'));
    const req = httpMock.expectOne('/dashboard/kpis?referenceMonth=2026-04');
    expect(req.request.method).toBe('GET');
    req.flush({ referenceMonth: '2026-04', debtors: [] });
    await expect(promise).resolves.toMatchObject({ referenceMonth: '2026-04' });
  });

  it('requests KPIs without params when reference month is absent', async () => {
    const promise = firstValueFrom(service.getKpis());
    const req = httpMock.expectOne('/dashboard/kpis');
    expect(req.request.method).toBe('GET');
    req.flush({ referenceMonth: '2026-04', debtors: [] });
    await expect(promise).resolves.toMatchObject({ referenceMonth: '2026-04' });
  });
});
