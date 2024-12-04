import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SteamTurbineOstComponent } from './steam-turbine-ost.component';

xdescribe('SteamTurbineOstComponent', () => {
  let component: SteamTurbineOstComponent;
  let fixture: ComponentFixture<SteamTurbineOstComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SteamTurbineOstComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SteamTurbineOstComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
