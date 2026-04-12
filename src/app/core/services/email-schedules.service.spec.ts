import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { EmailSchedulesService } from './email-schedules.service';

describe('EmailSchedulesService', () => {
  let service: EmailSchedulesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EmailSchedulesService],
    });

    service = TestBed.inject(EmailSchedulesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('normalizes invalid schedule responses with defaults', async () => {
    const schedulePromise = firstValueFrom(service.getKpiSummarySchedule());

    const req = httpMock.expectOne('/email-schedules/kpi-summary');
    expect(req.request.method).toBe('GET');
    req.flush({
      scheduleKey: '',
      enabled: 'yes',
      timezone: '',
      occurrences: [
        { dayOfWeek: 0, executionTime: '09:00' },
        { dayOfWeek: 1, executionTime: '24:99' },
        { dayOfWeek: 3, executionTime: '10:30' },
      ],
    });

    await expect(schedulePromise).resolves.toEqual({
      scheduleKey: 'KPI_SUMMARY',
      enabled: false,
      timezone: 'America/Sao_Paulo',
      occurrences: [{ dayOfWeek: 3, executionTime: '10:30' }],
    });
  });

  it('uses payload values as fallback when update response is incomplete', async () => {
    const payload = {
      enabled: true,
      timezone: 'UTC',
      occurrences: [{ dayOfWeek: 5 as const, executionTime: '08:15' }],
    };

    const schedulePromise = firstValueFrom(service.updateKpiSummarySchedule(payload));

    const req = httpMock.expectOne('/email-schedules/kpi-summary');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ enabled: false });

    await expect(schedulePromise).resolves.toEqual({
      scheduleKey: 'KPI_SUMMARY',
      enabled: false,
      timezone: 'UTC',
      occurrences: [{ dayOfWeek: 5, executionTime: '08:15' }],
    });
  });
});
