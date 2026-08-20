import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Faculty } from './faculty';

describe('Faculty', () => {
  let component: Faculty;
  let fixture: ComponentFixture<Faculty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, Faculty],
    }).compileComponents();

    fixture = TestBed.createComponent(Faculty);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
