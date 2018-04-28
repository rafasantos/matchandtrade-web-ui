import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { Item } from '../../classes/pojo/item';
import { ItemService } from '../../services/item.service';
import { Message } from '../message/message';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss'],
  providers: [ ItemService ]
})
export class ItemComponent implements OnInit {
  item: Item = new Item();
  itemFormGroup: FormGroup;
	itemHref: string;
  loading: boolean = true;
  nameFormControl: AbstractControl;
  descriptionFormControl: AbstractControl;
  message: Message = new Message();
	tradeMembershipHref: string;

  constructor(
    private route: ActivatedRoute,
    formBuilder: FormBuilder,
    private itemService: ItemService,
    private navigationService: NavigationService
  ) {
    this.buildForm(formBuilder);
  }

  ngOnInit() {
    this.tradeMembershipHref = this.navigationService.obtainData(this.route).tradeMembershipHref;
    this.itemHref = this.navigationService.obtainData(this.route).itemHref;
		
		if (!this.itemHref) {
			this.loading = false;
		} else {
			this.itemService.get(this.itemHref)
				.then(v => {
					this.item = v;
				})
				.catch(e => {
					this.message.setErrorItems(e);
				})
				.then(() => {
					this.populateForm(this.item);
					this.loading = false;
				});
		}

	}
	
  private buildForm(formBuilder: FormBuilder): void {
    this.itemFormGroup = formBuilder.group({
      'name': ['',Validators.compose([Validators.required, this.nameValidator])],
      'description': ['', Validators.compose([this.descriptionValidator])]
    });
    this.nameFormControl = this.itemFormGroup.controls['name'];
    this.descriptionFormControl = this.itemFormGroup.controls['description'];
  }

  private nameValidator(control: FormControl): {[s: string]: boolean} {
    if (control.value && (control.value.length < 3 || control.value.length > 150)) {
      return {invalid: true};
    }
  }

  private descriptionValidator(control: FormControl): {[s: string]: boolean} {
    if (control.value && control.value.length > 500) {
      return {invalid: true};
    }
  }

  private populateForm(item: Item) {
    this.nameFormControl.setValue(item.name);
    this.descriptionFormControl.setValue(item.description);
  }

  onSubmit() {
    this.loading = true;
    this.item.name = this.nameFormControl.value;
    this.item.description = this.descriptionFormControl.value;
    this.itemService.save(this.item, this.tradeMembershipHref)
      .then(v => {
        this.item = v;
        this.populateForm(this.item);
        this.navigationService.setNavigationMessage('Item saved.');
        this.navigateBack();
      })
      .catch(e => {
        this.message.setErrorItems(e);
        this.itemFormGroup.markAsPristine();
        this.loading = false;
      });
  }

  navigateBack() {
    this.navigationService.back();
  }

}
