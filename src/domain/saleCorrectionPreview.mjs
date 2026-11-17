import {makeLine,repriceLines,total} from './sale.mjs';
import {historicalCommerceLine} from './commerce.mjs';
import {calculateHistoricalItems} from './adminSales.mjs';
import {WHOLESALE_VERSION} from './wholesalePricing.mjs';
import {paymentAmounts} from './payment.mjs';
import {settlementSummary} from './settlementLedger.mjs';
export function saleCorrectionPreview(sale,values,serviceOptions=[],confirmedQuantities=[]){
 if(values.length!==sale.items.length)throw Error('Conserva todos los renglones de la venta.');
 let items=sale.items.map((old,n)=>{
  if(old.commerceVersion)return historicalCommerceLine(old,values[n],serviceOptions[n]||{});
  const tariff={key:old.tariffKey,price:old.normalPrice??old.price,unit:old.unit,productIds:old.eligibleProductIds,...(old.pricingVersion===WHOLESALE_VERSION?{pricingVersion:old.pricingVersion,wholesalePrice:old.wholesalePrice,amountPolicy:old.amountPolicy,priceSource:old.priceSource,priceSourceId:old.priceSourceId}:{})};
  const choice={kind:old.reference.kind,refId:old.reference.id,name:old.name,context:old.context,tariffs:[tariff]};
  const updated={...old,...makeLine(choice,tariff,old.entryMode,values[n],old.id,confirmedQuantities[n]??old.confirmedQuantity)};
  return old.pricingVersion?updated:{...calculateHistoricalItems([{...updated,pricingVersion:undefined}])[0],pricingVersion:undefined};
 });
 if(items.some(i=>i.pricingVersion===WHOLESALE_VERSION))items=repriceLines(items);
 const proposed=sale.monetary?paymentAmounts(items,sale.payment,sale.monetary.policyVersion).collectedCents/100:total(items);
 const original=settlementSummary(sale).originalConfirmedCents;
 return {items,total:proposed,commercial:total(items),originalConfirmedCents:original,pendingCents:original==null?null:Math.round(proposed*100)-original};
}
