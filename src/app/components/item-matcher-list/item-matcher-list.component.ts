import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Item } from '../../classes/pojo/item';
import { Attachment, AttachmentStatus } from '../../classes/pojo/attachment';
import { AttachmentService } from '../../services/attachment.service';
import { Message } from '../message/message';
import { NavigationService } from '../../services/navigation.service';
import { Pagination } from '../../classes/search/pagination';
import { race } from 'rxjs/operators/race';
import { SearchService } from '../../services/search.service';
import { StorageService } from '../../services/storage.service';
import { TradeMembership } from '../../classes/pojo/trade-membership';
import { TradeMembershipService } from '../../services/trade-membership.service';

class ItemView {
	constructor(item: Item) {
		this.href = item.getHref();
		this.name = item.name;
		this.description = item.description;
	}
  attachment: Attachment;
	description: string;
	displayItemMiniView: boolean = false;
	href: string;
	name: string;
  thumbnailLoaded: boolean = false;
}

@Component({
  selector: 'app-item-matcher-list',
  templateUrl: './item-matcher-list.component.html',
  styleUrls: ['./item-matcher-list.component.scss'],
  providers: [TradeMembershipService, SearchService, AttachmentService]
})
export class ItemMatcherListComponent implements OnInit {

	items: ItemView[] = Array<ItemView>();
  loading: boolean = true;
  message: Message = new Message();
  pagination: Pagination = new Pagination(1, 10, 0);
  tradeMembership: TradeMembership;
	tradeMembershipHref: string;
	
  constructor(
    private navigationService: NavigationService,
		private route: ActivatedRoute,
		private attachmentService: AttachmentService,
    private searchService: SearchService,
    private storageService: StorageService,
    private tradeMembershipService: TradeMembershipService,
	) { }
	
	displayLoadingThumbnail(item: ItemView):boolean {
		return !item.thumbnailLoaded;
	}
	
	classForThumbnail(item: ItemView): string {
		let result = 'thumbnail';
		result += (item.attachment ? ' has-thumbnail' : '');
		return result;
	}

  ngOnInit() {
    this.tradeMembershipHref = this.navigationService.obtainData(this.route).tradeMembershipHref;
    this.message.setNavigationMessage(this.navigationService.getNavigationMessage());

    // Remember last visited page
    const lastPage = this.storageService.removeLastItemMatcherListPage();
    this.pagination.page.number = (lastPage ? lastPage : 1);

    this.tradeMembershipService.get(this.tradeMembershipHref)
      .then(tradeMembership => {
        this.tradeMembership = tradeMembership;
        return tradeMembership;
      })
      .then(tradeMembership => {
        return this.search(tradeMembership);
			})
      .catch(e => {
        this.message.setErrorItems(e);
      })
      .then(() => this.loading = false);
  }
  
  goToPage(pageNumber: number) {
		this.pagination.page.number = pageNumber;
		this.loading = true;
		this.search(this.tradeMembership)
			.then(() => {
				this.storageService.setLastItemMatcherListPage(this.pagination.page.number);
				this.loading = false;
			})
			.catch((e) => this.message.setErrorItems(e));
	}
	
	private loadThumbnail(item: ItemView, attachmentHref: string) {
		this.attachmentService.get(attachmentHref).then(attachments => {
			if (attachments.length > 0) {
        item.attachment = attachments[0];
        item.attachment.status = AttachmentStatus.STORED;
			}
			item.thumbnailLoaded = true;
		});
  }
  
  obtainAttachment(item: ItemView): Attachment {
    return item.attachment;
  }

  obtainInfoText(item: ItemView): string {
    return (item.displayItemMiniView ? 'Less Info' : 'More Info');
  }

  private search(tradeMembership: TradeMembership): Promise<any> {
    return this.searchService.searchItemsToMatch(tradeMembership, this.pagination.page).then(searchResults => {
      this.items = new Array<ItemView>();
			searchResults.results.forEach(v => {
				const itemProxy = new ItemView(v);
				this.loadThumbnail(itemProxy, v.getAttachmentsHref());
				this.items.push(itemProxy);
			});
      this.pagination = searchResults.pagination;
    });
  }

  navigateToOffer(item: ItemView) {
    this.navigationService.navigate('item-matcher-offer', {tradeMembershipHref: this.tradeMembershipHref, itemHref: item.href});
  }

  navigateBack(): void {
    this.navigationService.back();
	}

	toogleItemMiniView(item: ItemView): void {
		item.displayItemMiniView = !item.displayItemMiniView;
	}
	
}
