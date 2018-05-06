import { browser, by, element } from 'protractor';

export class ItemPage {

  elementItemsButton() {
		return element(by.cssContainingText('button', 'Items'));
	}
	
	elementCreateButton() {
    return element(by.cssContainingText('button', 'Create'));
  }

  elementItemName() {
    return element(by.id('item-name'));
  }

  elementItemRow(name: string) {
		return element(by.cssContainingText('.item-row', name)).all(by.tagName('div')).first();
  }

  elementSaveItemButton() {
    return element(by.cssContainingText('button', 'Save'));
  }

  elementSavedMessage() {
    return element(by.cssContainingText('.message-body', 'Item saved.'));
  }

}
