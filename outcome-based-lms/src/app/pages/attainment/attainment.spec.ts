import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Attainment } from './attainment';

describe('Attainment', () => {
  let component: Attainment;
  let fixture: ComponentFixture<Attainment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, Attainment],
    }).compileComponents();

    fixture = TestBed.createComponent(Attainment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
