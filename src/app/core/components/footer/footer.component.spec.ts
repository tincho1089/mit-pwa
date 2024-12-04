import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';
import { SharedService } from '../../services/shared.service';
import { Pipe, PipeTransform } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Pipe({ name: 'translate' })
class MockTranslatePipe implements PipeTransform {
    transform(value: string): string {
        return value;
    }
}

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  const mockSharedService = jasmine.createSpyObj('sharedService',['checkUpdates','checkNetworkStatus','scrollToTop'],['updates'])

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FooterComponent,MockTranslatePipe],
      providers: [{ provide: SharedService, useValue: mockSharedService }
      ],
      errorOnUnknownElements: false, // enable it as required
      errorOnUnknownProperties: false // enable it as required
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
