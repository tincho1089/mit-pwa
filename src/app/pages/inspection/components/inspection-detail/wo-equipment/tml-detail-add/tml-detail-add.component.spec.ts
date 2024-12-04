import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TmlDetailAddComponent } from './tml-detail-add.component';

describe('TmlDetailAddComponent', () => {
  let component: TmlDetailAddComponent;
  let fixture: ComponentFixture<TmlDetailAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TmlDetailAddComponent]
    });
    fixture = TestBed.createComponent(TmlDetailAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
