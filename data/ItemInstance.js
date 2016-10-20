
// ItemInstance
// Helper object for HeroInstance
function ItemInstance(itemId, properties) {
	properties = properties || {};
	let item = DotaData.getTypeData("Items", itemId, properties.version);

	Object.defineProperty(this, "ID", {value: itemId});
	Object.defineProperty(this, "displayElement", {writable: true});
	Object.defineProperty(this, "chargeElement", {writable: true});
	Object.defineProperty(this, "dynamicElements", {writable: true, value: {}});
	Object.defineProperty(this, "boundDelete", {writable: true});
	Object.defineProperty(this, "boundUpdate", {writable: true});
	Object.defineProperty(this, "heroRef", {writable: true});
	Object.defineProperty(this, "heroTotal", {get: function heroTotalGetter(){
		if (this.heroRef && this.heroRef.Total)
			return this.heroRef.Total;
		return {};
	}, enumerable: false})
	Object.defineProperty(this, "buffReferences", {value: new Map(), writable: true});
	//this.ownerBuff - the item owner's aura-buff from this item

	PropertyProcessor.applyDataProperties(this, item)

	if (typeof properties.charges === "number")
		if (item.ChargesMin != undefined && properties.charges >= item.ChargesMin)
			this.Charges = properties.charges;
		else if ( item.ChargesMin != undefined )
			this.Charges = item.ChargesMin;
		else
			this.Charges = properties.charges;
	if (typeof properties.chargesMax === "number")
		this.ChargesMax = properties.chargesMax
}

// Cloning method
ItemInstance.prototype.copy = function () {
	var props = { version: this.Version };
	if (this.Charges != undefined)
		props.charges = this.Charges;
	return new ItemInstance(this.ID, props);
}

ItemInstance.prototype.update = function () {
	if (this.boundUpdate)
		this.boundUpdate()
	for (let [key, buff] of this.buffReferences)
		buff.update()
	this.updateDisplayElement()
}

ItemInstance.prototype.delete = function () {
	if (this.boundDelete)
		this.boundDelete();
	for (var [key, buff] of this.buffReferences)
		buff.delete()
	if (this.displayElement)
		this.displayElement.parentElement.removeChild(this.displayElement);
	if (this.ownerBuff)
		this.ownerBuff.delete()
	if (this.boundUpdate)
		this.boundUpdate()
}

ItemInstance.prototype.activate = function() {
	if (!this.Buff || this.Level < 1)
		return;
	if (this.Buff.NoTarget && this.Buff.Self)
		if (typeof this.Buff.Self === "string")
			this.heroRef.addBuff(new BuffInstance(this.Buff.Self, {level: this.Level, levelMax: this.LevelMax, charges: this.Charges, chargesMax: this.ChargesMax }), this.Buff.Refresh )
		else if (this.Buff.Self === true)
			this.heroRef.addBuff(new BuffInstance(this.Buff.Name, {level: this.Level, levelMax: this.LevelMax, charges: this.Charges, chargesMax: this.ChargesMax }), this.Buff.Refresh )
		else if (Array.isArray(this.Buff.Self))
			for (var buffId of this.Buff.Self)
				this.heroRef.addBuff(new BuffInstance(buffId, {level: this.Level, levelMax: this.LevelMax, charges: this.Charges, chargesMax: this.ChargesMax }), this.Buff.Refresh )

	if (this.Buff.NoTarget && this.Buff.Teammates)
        for (var teammate of this.heroRef.getTeammates())
			if (typeof this.Buff.Teammates === "string")
				teammate.addBuff(new BuffInstance(this.Buff.Teammates, {level: this.Level, levelMax: this.LevelMax, charges: this.Charges, chargesMax: this.ChargesMax }), this.Buff.Refresh )
			else if (this.Buff.Teammates === true)
				teammate.addBuff(new BuffInstance(this.Buff.Name, {level: this.Level, levelMax: this.LevelMax, charges: this.Charges, chargesMax: this.ChargesMax }), this.Buff.Refresh )
			else if (Array.isArray(this.Buff.Teammates))
				for (var buffId of this.Buff.Teammate)
					teammate.addBuff(new BuffInstance(buffId, {level: this.Level, levelMax: this.LevelMax, charges: this.Charges, chargesMax: this.ChargesMax }), this.Buff.Refresh )
}

// Checks if all elements of array are valid ItemInstance objects
ItemInstance.isValidArray = function( itemInstanceArray ) {
	if (!Array.isArray(itemInstanceArray))
		throw itemInstanceArray+" is not a valid array";
	for (var item of itemInstanceArray)
		if (!(item instanceof ItemInstance))
			throw "Object " + item + " is not an ItemInstance object";
	return itemInstanceArray;
}

ItemInstance.prototype.toString = function () {
	return "[ItemInstance "+this.ID+"]";
}

// creates and returns an element to display in the item container
ItemInstance.prototype.createDisplayElement = function() {
	return UIHelper.createDisplayElement(this)
}

ItemInstance.prototype.updateDisplayElement = function () {
	UIHelper.updateDisplayElements(this)
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
