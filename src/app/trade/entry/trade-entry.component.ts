import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { KeyValue } from '@angular/common';
import { LoadingAndMessageBannerSupport } from 'src/app/class/common/loading-and-message-banner-support';
import { MembershipService } from 'src/app/service/membership.service';
import { Membership, MembershipType } from 'src/app/class/pojo/membership';
import { NavigationService } from '../../service/navigation.service';
import { Trade, TradeState, TradeUtil } from '../../class/pojo/trade';
import { TradeService } from '../../service/trade.service';
import { ValidatorUtil } from 'src/app/class/common/validator-util';
import { ValidationError } from 'src/app/class/common/validation-error';
import { MatSnackBar } from '@angular/material';
import { SnackBarHelper } from 'src/app/src/app/class/common/snack-bar-helper';

@Component({
  selector: 'app-trade-entry',
  templateUrl: './trade-entry.component.html',
  styleUrls: ['./trade-entry.component.scss'],
  providers: [TradeService]
})
export class TradeEntryComponent extends LoadingAndMessageBannerSupport implements OnInit {
  availableStates: KeyValue<TradeState, string>[] = [];
  nameFormControl: AbstractControl;
  descriptionFormControl: AbstractControl;
  membership: Membership;
  stateFormControl: AbstractControl;
  newEntry: boolean = true;
  snackBarHelper: SnackBarHelper;
  trade: Trade = new Trade();
  tradeFormGroup: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private membershipService: MembershipService,
    private navigationService: NavigationService,
    private route: ActivatedRoute,
    snackBar: MatSnackBar,
    private tradeService: TradeService) {
    super();
    this.snackBarHelper = new SnackBarHelper(snackBar, navigationService);
  }

  async ngOnInit() {
    this.buildForm();
    try {
      const tradeHref = this.navigationService.obtainData(this.route).tradeHref;
      if (tradeHref) {
        this.trade = await this.tradeService.find(tradeHref);
        await this.loadTrade();
      }
    } catch (e) {
      this.showErrorMessage(e);
    } finally {
      this.loading = false;
    }
  }

  private authenticatedUserIsTradeOwner(): boolean {
    return this.membership && this.membership.type == MembershipType.OWNER;
  }

  private buildForm(): void {
    this.tradeFormGroup = this.formBuilder.group({
      'name': ['', Validators.compose([Validators.required, ValidatorUtil.minLengthWithTrim(3), ValidatorUtil.maxLengthWithTrim(150)])],
      'description': [ '', {validators: [Validators.required] }],
      'state': []
    });
    this.nameFormControl = this.tradeFormGroup.controls['name'];
    this.descriptionFormControl = this.tradeFormGroup.controls['description'];
    this.stateFormControl = this.tradeFormGroup.controls['state'];
  }

  classMainForm(): string {
    return this.loading ? "mt-content mt-hide" : "mt-content";
  }

  private async loadTrade(): Promise<void> {
    this.newEntry = false;
    this.nameFormControl.setValue(this.trade.name);
    this.descriptionFormControl.setValue(this.trade.description);
    
    // Populate available states only
    this.availableStates = TradeUtil.toAvailableStatesKeyValue(this.trade.state).sort((a, b) => TradeUtil.compareStates(a.key, b.key));
    this.stateFormControl.setValue(this.trade.state);

    // Disable form if autheticated user is not the trade owner
    try {
      this.membership = await this.membershipService.findByTradeId(this.trade.tradeId);
      if (!this.authenticatedUserIsTradeOwner()) {
        this.tradeFormGroup.disable();
      }
    } catch (e) {
      this.showErrorMessage(e);
    }
  }

  private loadTradeFromForm() {
    this.trade.name = this.nameFormControl.value.trim();
    this.trade.description = this.descriptionFormControl.value;
    // Sanitize description, empty string must be treated as undefined or we get server error: description must be bigger than 3 chars
    if (this.trade.description == null || this.trade.description.length < 3) {
        this.trade.description = undefined;
    }
    this.trade.state = this.stateFormControl.value;
  }

  showStatus(): boolean {
    return !this.newEntry;
  }

  showSaveButton(): boolean {
    return this.authenticatedUserIsTradeOwner() || this.trade.getSelfHref() == null;
  }

  async onSubmit() {
    this.loading = true;
    try {
      this.validate();
      this.loadTradeFromForm();
      this.trade = await this.tradeService.save(this.trade);
      this.snackBarHelper.back('Trade saved', 'trade/entry', {tradeHref: this.trade.getSelfHref()})
    } catch (e) {
      this.showErrorMessage(e);
    } finally {
      this.loading = false;
    }
  }

  private validate(): void {
    if (this.descriptionFormControl.value.length >= 25000) {
      throw new ValidationError('Description is too long');
    }
    if (!this.descriptionFormControl.valid || !this.nameFormControl.valid) {
      throw new ValidationError('Please ensure that the fields below are valid');
    }
  }
}
