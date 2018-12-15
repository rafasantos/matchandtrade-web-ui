import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeListComponent } from './entry.component';

describe('TradeListComponent', () => {
  let component: TradeListComponent;
  let fixture: ComponentFixture<TradeListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TradeListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
