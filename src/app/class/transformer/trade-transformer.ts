import { Trade, TradeState } from '../pojo/trade';
import { Transformer } from './transformer';
import { HttpResponse } from '@angular/common/http';

export class TradeTransformer extends Transformer<Trade>{
  toPojo(pojoObject: any): Trade {
    let pojo = pojoObject;
    if (pojoObject instanceof HttpResponse) {
      pojo = pojoObject.body;
    }
    const result = new Trade();
    result.links = this.buildLinks(pojo._links);
    result.description = pojo.description;
    result.name = pojo.name;
    result.tradeId = pojo.tradeId;
    result.state = TradeState[String(pojo.state)];
    return result;
  }
}
