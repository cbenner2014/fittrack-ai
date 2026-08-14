import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GimnasiosPage } from './gimnasios.page';

describe('GimnasiosPage', () => {
  let component: GimnasiosPage;
  let fixture: ComponentFixture<GimnasiosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GimnasiosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
