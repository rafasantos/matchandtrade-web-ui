import { Component, OnInit } from '@angular/core';
import { Response } from '@angular/http';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { FormControl } from '@angular/forms/src/model';
import { KeyValuePair } from '../../../classes/pojo/key-value-pair';
import { Message, MessageType } from '../../../components/message/message';
import { RouteAction } from '../../../classes/route/route-action';
import { Trade, TradeState } from '../../../classes/pojo/trade';
import { TradeService } from '../../../services/trade.service';
import { UserService } from '../../../services/user.service';
import { TradeMembershipService } from '../../../services/trade-membership.service';
import { TradeMembership, TradeMembershipType } from '../../../classes/pojo/trade-membership';
import { Page } from '../../../classes/search/page';
import { SearchResult } from '../../../classes/search/search-result';

export class TradeMembershipNotFoundException {};

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss'],
  providers: [ TradeService, TradeMembershipService ]
})
export class TradeComponent implements OnInit {
  trade: Trade = new Trade();
  tradeMembership: TradeMembership;
  tradeFormGroup: FormGroup;
  nameFormControl: AbstractControl;
  routeAction: string;
  stateFormControl: AbstractControl;

  loading: boolean = true;
  message: Message = new Message();
  states: KeyValuePair[] = [];

  constructor( 
      private route: ActivatedRoute,
      formBuilder: FormBuilder,
      private router: Router,
      private tradeService: TradeService,
      private tradeMembershipService: TradeMembershipService,
      private userService: UserService) {
    
    this.buildForm(formBuilder);
    this.routeAction = this.route.snapshot.params['routeAction'];
  }

  ngOnInit() {
    if (this.routeAction == RouteAction.CREATE) {
      this.loading = false;
    } else if (this.routeAction == RouteAction.VIEW) {
      let tradeHref = this.route.snapshot.paramMap.get('href');
      this.tradeService.get(tradeHref)
        .then(v => {
          // Load Trade data
          this.trade = v;
          return v;
        })
        .then(v => {
          // Load current User
          return this.userService.getAuthenticatedUser()
            .then(user => {
              return { tradeId: v.tradeId, userId: user.userId };
            });
        })
        .then(v => {
          // Search TradeMembership
          return this.tradeMembershipService.search(new Page(1, 1), v.tradeId, v.userId)
            .then(v => {
              this.tradeMembership = v.results[0]; 
              return v;
            });
        })
        .catch(e => {
          if (!(e instanceof Response && e.status == 404)) {
            this.message.setErrorItems(e);
          }
        })
        .then(() => {
          this.populateForm(this.trade, this.tradeMembership);
          this.loading = false;
        });
    } else {
      this.message.setErrorItems("Unknown route action: " + this.routeAction);
    }
  }

  private buildForm(formBuilder: FormBuilder): void {
    this.tradeFormGroup = formBuilder.group({
      'name': ['',Validators.compose([Validators.required, this.nameValidator])],
      'state': []
    });
    this.nameFormControl = this.tradeFormGroup.controls['name'];
    this.stateFormControl = this.tradeFormGroup.controls['state'];
    for(let v in TradeState) {
      this.states.push(new KeyValuePair(v, TradeState[v].toString()));
    }
  }

  isStateDisplayable() {
    return (this.routeAction == RouteAction.VIEW || this.stateFormControl.value != null);
  }

  private populateForm(trade: Trade, tradeMembership: TradeMembership) {
    this.nameFormControl.setValue(trade.name);
    this.stateFormControl.setValue(trade.state);
    if (!(tradeMembership && TradeMembershipType[tradeMembership.type] == TradeMembershipType.OWNER)) {
       this.tradeFormGroup.disable();
    }
  }
  
  private nameValidator(control: FormControl): {[s: string]: boolean} {
    if (control.value && (control.value.length < 3 || control.value.length > 150)) {
      return {invalid: true};
    }
  }

  onSubscribe() {
    this.loading = true;
    this.userService.getAuthenticatedUser()
      .then(user => {
        let tradeMembership = new TradeMembership();
        tradeMembership.tradeId = this.trade.tradeId;
        tradeMembership.userId = user.userId;
        return tradeMembership;
      })
      .then(v => { 
        this.tradeMembershipService.save(v)
          .then(v => {
            this.message.setInfoItems("Subscribed.");
            this.tradeMembership = v;
            this.loading = false;
          })
          .catch(e => {
            this.message.setErrorItems(e);
            this.loading = false;      
          });
      })
  }

  onSubmit() {
    this.loading = true;
    this.trade.name = this.nameFormControl.value;
    this.trade.state = this.stateFormControl.value;
    this.tradeService.save(this.trade)
      .then(v => {
        this.trade = v;
        this.populateForm(this.trade, null);
        this.tradeFormGroup.enable();
        this.tradeFormGroup.markAsPristine();
        this.message.setInfoItems("Trade saved.");
        this.loading = false;
      }).catch(e => {
        this.message.setErrorItems(e);
        this.tradeFormGroup.markAsPristine();
        this.loading = false;
      });
  }

  onSubmitItems(): void {
    this.router.navigate(['items', {routeAction: RouteAction.LIST, tradeMembershipHref: this.tradeMembership._href}]);
  }

  displaySubscribeButton():boolean {
    return ((this.routeAction==RouteAction.CREATE) ? false : !this.tradeMembership);
  }

  displaySubmitItemsButton():boolean {
    return true;
  }
}
