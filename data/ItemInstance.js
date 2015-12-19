
// ItemInstance
// Helper object for HeroInstance
function ItemInstance(itemId, properties) {
	properties = properties || {};
	var item = DotaData.getItemProperties(itemId, properties.version);
	
	Object.defineProperty(this, "ID", {value: itemId});
	Object.defineProperty(this, "displayElement", {writable: true});
	Object.defineProperty(this, "chargeElement", {writable: true});
	Object.defineProperty(this, "dynamicElements", {writable: true, value: {}});
	Object.defineProperty(this, "boundDelete", {writable: true});
	Object.defineProperty(this, "boundUpdate", {writable: true});
	Object.defineProperty(this, "buffReferences", {value: new Map(), writable: true});
	
	for (var prop in item) {
		var value = item[prop];
		if (value instanceof Function)
			Object.defineProperty(this, prop, { get: value, enumerable: true });
		else
			this[prop] = value;	
	}
	if (properties.charges && this.Charges)
		this.Charges = properties.charges;
	if (this.Aura)
		this.AuraProperties = DotaData.getBuffProperties(this.Aura, properties.version)
}

// Cloning method
ItemInstance.prototype.clone = function () {
	var props = { version: this.Version };
	if (this.Charges) props.charges = this.Charges;
	return new ItemInstance(this.ID, props);
}

ItemInstance.prototype.update = function () {
	if (this.boundUpdate)
		this.boundUpdate()
	for (var buff of this.buffReferences)
		buff[1].update()
	this.updateDisplayElement()
}

ItemInstance.prototype.delete = function () {
	for (var buff of this.buffReferences)
		buff[1].delete()
	if (this.displayElement)
		this.displayElement.parentElement.removeChild(this.displayElement);
	if (this.ownerBuff)
		this.ownerBuff.delete()
	if (this.boundDelete)
		this.boundDelete();
}

// Checks if all elements of array are valid ItemInstance objects
ItemInstance.isValidArray = function( itemInstanceArray ) {
	if (!Array.isArray(itemInstanceArray))
		throw itemInstanceArray+" is not a valid array";
	for (var item of itemInstanceArray) 
		if (!item instanceof ItemInstance) 
			throw "Object " + item + " is not an ItemInstance object";
	return itemInstanceArray;
}

ItemInstance.prototype.toString = function () {
	return "[ItemInstance "+this.ID+"]";
}

// creates and returns an element to display in the item container 
ItemInstance.prototype.createDisplayElement = function() {
	if (this.displayElement)
		return this.displayElement;
	
	var div = document.createElement("div");
	div.className = "item-display item";
	div.style.backgroundImage = "url(images/items/" + this.ID + ".png)";
	
	if (typeof this.Charges === "number") {
		var chargeElement = document.createElement("span");
		chargeElement.textContent = this.Charges;
		chargeElement.className = "item-display-charges";
		this.chargeElement = chargeElement;
		div.appendChild(chargeElement);
	}
	var deleteButton = document.createElement("button");
		deleteButton.className = "item-display-delete";
		deleteButton.onclick = this.delete.bind(this);
		div.appendChild(deleteButton);
	
	div.appendChild(ElementHelper.createDetailedTooltip(this));
	
	this.displayElement = div;
	this.updateDisplayElement()
	return div;
}

ItemInstance.prototype.updateDisplayElement = function () {
	ElementHelper.updateDisplayElements(this)
	if (this.ownerBuff)
		this.ownerBuff.updateDisplayElement()
}

// adds the owner of this item
ItemInstance.prototype.addOwner = function(owner) {
	if (!this.Aura) return;
	var newBuff = new BuffInstance(this.Aura);
	newBuff.boundUnlink = this.removeReferencedBuff.bind(this, owner);
	this.ownerBuff = newBuff;
	newBuff.ownerRef = owner;
	newBuff.emitterRef = this;
	owner.addBuff(newBuff, "override");
}

ItemInstance.prototype.addTeammate = function(newTeammate) {
	if (newTeammate === this) return;
	if (!this.Aura) return;
	if (!this.buffReferences.has(newTeammate) ) {
		var newBuff = new BuffInstance(this.Aura);
		newBuff.ownerRef = this.heroRef;
		newBuff.emitterRef = this;
		newBuff.boundUnlink = this.removeReferencedBuff.bind(this, newTeammate);
		newTeammate.addBuff(newBuff, "leave");
		this.buffReferences.set(newTeammate, newBuff);
	}
}

ItemInstance.prototype.removeTeammate = function(oldTeammate) {
	if (!this.Aura) return;
	if (this.buffReferences.has(oldTeammate)) {
		this.buffReferences.get(oldTeammate).delete();
		this.buffReferences.delete(oldTeammate);
	}
}

ItemInstance.prototype.removeReferencedBuff = function(teammate) {
	this.buffReferences.delete(teammate);
}
