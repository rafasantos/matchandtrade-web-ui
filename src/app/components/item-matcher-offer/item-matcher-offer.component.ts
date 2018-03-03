import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { CheckableItem } from './checkable-item';
import { Item } from '../../classes/pojo/item';
import { ItemService } from '../../services/item.service';
import { Message } from '../message/message';
import { Offer } from '../../classes/pojo/offer';
import { OfferService } from '../../services/offer.service';
import { Page } from '../../classes/search/page';
import { Pagination } from '../../classes/search/pagination';
import { TradeMembershipService } from '../../services/trade-membership.service';
import { NotFoundException } from '../../classes/exceptions/service-exceptions';

@Component({
  selector: 'app-item-matcher-offer',
  templateUrl: './item-matcher-offer.component.html',
  styleUrls: ['./item-matcher-offer.component.scss'],
  providers: [ ItemService, TradeMembershipService, OfferService ]
})
export class ItemMatcherOfferComponent implements OnInit {

  dirty: boolean = false;
  loading: boolean = true;
  message: Message = new Message();
  offerableItems: CheckableItem[] = new Array<CheckableItem>();
  offers: Offer[] = new Array<Offer>();
  pagination = new Pagination(1, 5, 0);
  tradeMembershipHref: string;
  wantedItem: Item;

  constructor(
    private itemService: ItemService,
    private offerService: OfferService,
    private route: ActivatedRoute,
    private router: Router,
    private tradeMembershipService: TradeMembershipService
  ) { }

  ngOnInit() {
    this.tradeMembershipHref = this.route.snapshot.paramMap.get("tradeMembershipHref");
    const wantedItemHref = this.route.snapshot.paramMap.get("itemHref");
    
    this.itemService.get(wantedItemHref).then(v => {
      this.wantedItem = v;
    })
    .then(() => {
      // TODO Handle large results with multiple pages
      return this.itemService.search(this.pagination.page, this.tradeMembershipHref);
    })
    .then(v => {
      this.offerableItems = this.transformFromItemsToCheckableItems(v.results);
      this.pagination = v.pagination;
    })
    .then(() => this.initCheckableItems())
  }

  private initCheckableItems(): void {
    this.offers = new Array<Offer>();
    // TODO Handle large results with multiple pages
    this.offerService.search(this.pagination.page, this.tradeMembershipHref, this.wantedItem.itemId).then(v => {
      this.offers = v.results;
      v.results.forEach(offer => {
        this.offerableItems.forEach(offerableItem => {
          if (offerableItem.itemId == offer.offeredItemId) {
            offerableItem.setChecked(true);
          }
        });
      });
    })
    .catch((e) => {
      if (!(e instanceof NotFoundException)) {
        this.message.setErrorItems(e);
      }
    })
    .then(() => {
      this.dirty = false;
      this.loading = false;
    });
  }
  
  isSaveEnabled(): any {
    return (this.dirty ? null : 'disabled');
  }

  //TODO
  nextPage() {
  }
  // TODO
  previousPage() {
  }

  save() {
    this.loading = true;
    const promises = new Array<Promise<any>>();

    this.offers.forEach(v => {
      const promise = this.offerService.delete(this.tradeMembershipHref, v.offerId);
      promises.push(promise);
    });

    this.offerableItems.filter(v => v.checked()).forEach(v => {
      const promise = this.offerService.offer(this.tradeMembershipHref, v, this.wantedItem);
      promises.push(promise);
    });

    Promise.all(promises).then(() => {
      this.message.setInfoItems('Offers saved.');
    })
    .catch(e => this.message.setErrorItems(e))
    .then(() => this.initCheckableItems());
  }

  navigateBack() {
    this.router.navigate(['/item-matcher-list', {tradeMembershipHref: this.tradeMembershipHref}]);
  }

  toogleOfferableItem(checkableItem: CheckableItem) {
    checkableItem.toogleChecked();
    this.dirty = true;
  }

  private transformFromItemsToCheckableItems(items: Item[]): CheckableItem[] {
    const result: CheckableItem[] = new Array<CheckableItem>();
    items.forEach(item => {
      let checkableItem = new CheckableItem();
      Object.assign(checkableItem, item);
      result.push(checkableItem);
    });
    return result;
  }

}