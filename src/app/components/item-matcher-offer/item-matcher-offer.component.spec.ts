import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { ActivatedRouteMock, NavigationServiceMock } from '../../../test/router-mock';
import { CheckableItem } from './checkable-item';
import { Item } from '../../classes/pojo/item';
import { ItemService } from '../../services/item.service';
import { ItemServiceMock } from '../../../test/item-service-mock';
import { ItemMatcherOfferComponent } from './item-matcher-offer.component';
import { LoadingComponent } from '../loading/loading.component';
import { MessageComponent } from '../message/message.component';
import { NavigationService } from '../../services/navigation.service';
import { Offer } from '../../classes/pojo/offer';
import { OfferService } from '../../services/offer.service';
import { Page } from '../../classes/search/page';
import { Pagination } from '../../classes/search/pagination';
import { PaginationComponent } from '../pagination/pagination.component';
import { PageTitleComponent } from '../page-title/page-title.component';
import { SearchResult } from '../../classes/search/search-result';
import { TradeMembershipService } from '../../services/trade-membership.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Message } from '../message/message';

describe('item-matcher-offer.component', () => {
  let component: ItemMatcherOfferComponent;
  let fixture: ComponentFixture<ItemMatcherOfferComponent>;

  class OfferServiceMock {
    search(page: Page, tradeMembershipHref: string, wantedItemId: number): Promise<SearchResult<Offer>> {
      return new Promise<SearchResult<Offer>>((resolve, reject) => {
        const offer = new Offer(1, 2, 3);
        const results = new Array<Offer>();
        results.push(offer);
        const result = new SearchResult<Offer>(results, new Pagination(1,5,1));
        resolve(result);
      });
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        MessageComponent,
        LoadingComponent,
        ItemMatcherOfferComponent,
				PaginationComponent,
				PageTitleComponent
      ]})
      .overrideComponent(ItemMatcherOfferComponent, {
        set: {
          providers:[
            { provide: ActivatedRoute, useValue: new ActivatedRouteMock() },
            { provide: ItemService, useClass: ItemServiceMock },
            { provide: NavigationService, useClass: NavigationServiceMock },
            { provide: OfferService, useClass: OfferServiceMock },
            { provide: Router, useValue: RouterTestingModule.withRoutes([]) },
          ]
        }
      })    
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemMatcherOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display wanted item name', () => {
    component.ngOnInit();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
			expect(fixture.nativeElement.querySelector('.wanted-item-paragraph i').innerHTML).toBe('ItemServiceMock.GET.name');
    });
  });

  it('should display offering items table', () => {
    component.ngOnInit();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#offering-items-table')).toBeDefined();
      expect(fixture.nativeElement.querySelector('#item-offer-name').innerHTML).toBe('ItemServiceMock.SEARCH.name1');
    });
  });

  it('should disable [save button] when page loads', () => {
    component.ngOnInit();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#save-offer').disabled).toBeTruthy();
    });
  });

  it('should enable toogle offerable item', () => {
    component.ngOnInit();
    fixture.whenStable().then(() => {
      const checkableItem: CheckableItem = component.offerableItems[3];
      const originalCheckableItemCheckedValue = checkableItem.checked();
      component.toogleOfferableItem(component.offerableItems[3]);
      fixture.detectChanges();
      expect(checkableItem.checked()).toBe(!originalCheckableItemCheckedValue);
    });
  });

  it('should load offers', () => {
    component.ngOnInit();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.offerableItems[0].checked()).toBe(true);
      expect(component.offerableItems[1].checked()).toBe(false);
    });
  });

});
