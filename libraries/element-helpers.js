// HTML element helper functions

ElementHelper = {};

/**
 * Display element constructor. Shared by ItemInstance, AbilityInstance and
 * SkillInstance objects.
 * @param {object} name description
 */
ElementHelper.createDisplayElement = function(object) {
	if (object.displayElement)
		return object.displayElement;

	var div = document.createElement("div");
	object.displayElement = div;
	div.classList.add("item-display");
	if (object instanceof AbilityInstance || object instanceof BuffInstance)
		div.classList.add("ability");
	else if (object instanceof ItemInstance )
		div.classList.add("item");

	if (typeof object.Image == "string")
		div.style.backgroundImage = "url(images/abilities/" + object.Image + ".png)";
	else if (object instanceof ItemInstance)
		div.style.backgroundImage = "url(images/items/" + object.ID + ".png)";
	else
		div.style.backgroundImage = "url(images/abilities/" + object.ID + ".png)";

	if (typeof object.Level === "number") {
		var levelElement = document.createElement("span");
		levelElement.className = "item-display-levels";
		levelElement.textContent = DotaData.numericToRoman(object.Level);
		div.appendChild(levelElement);
		object.levelElement = levelElement;
	}

	if (typeof object.Charges === "number") {
		var chargeElement = document.createElement("span");
		chargeElement.textContent = object.Charges;
		chargeElement.className = "item-display-charges";
		object.chargeElement = chargeElement;
		div.appendChild(chargeElement);
	}

	if (object.Buff) {
		var activateButton = document.createElement("button");
		activateButton.className = "item-display-activate";
		activateButton.onclick = object.activate.bind(object);
		div.appendChild(activateButton);
	}

	if (object instanceof ItemInstance || object instanceof BuffInstance && object.Class != "Aura") {
		var deleteButton = document.createElement("button");
		deleteButton.className = "item-display-delete";
		deleteButton.onclick = object.delete.bind(object);
		div.appendChild(deleteButton);
	}

	div.appendChild(ElementHelper.createDetailedTooltip(object));

	if (object.Hidden == true)
			object.displayElement.style.display = "none"

	return div;
}

// object - ItemInstance, AbilityInstance, BuffInstance
ElementHelper.createDetailedTooltip = function ( object ) {
	var el = document.createElement("div"),
		h1 = document.createElement("h1");
	el.className = "item-tooltip"
	h1.textContent = object.Name || object.ID;
	el.appendChild(h1);

	if ("Level" in object && !object.emitterRef && !object.LockedLevel) {
		var levelLabel = document.createElement("span");
		levelLabel.textContent = "Level:";
		levelLabel.style.textAlign = "right";
		//levelLabel.style.padding = "3px";
		levelLabel.style.width = "50px";
		el.appendChild(levelLabel);

		var levelInput = document.createElement("input");
		levelInput.style.width = "3em";
		levelInput.value = object.Level;
		levelInput.min = typeof object.LevelMin === "number" ? object.LevelMin : 0;
		levelInput.max = object.LevelMax;
		levelInput.type = "number";
		levelInput.className = "mini-spinner";
		levelInput.onchange = (function(e,u){
			object.Level = Number.parseInt(e.target.value);
			if ("Charges" in object && "ChargesMax" in object)
				object.Charges = Math.min(object.Charges, object.ChargesMax);
			object.update()
		})
		el.appendChild(levelInput);

		el.appendChild(document.createElement("br"));
	}

	if ("Charges" in object && !object.emitterRef && !object.LockedCharges) {
		var chargeLabel = document.createElement("span");
		if (object.ChargesSemantic)
			chargeLabel.textContent = object.ChargesSemantic.toString() + ":";
		else if (object instanceof AbilityInstance || object instanceof BuffInstance)
			chargeLabel.textContent = "Stacks:";
		else
			chargeLabel.textContent = "Charges:";
		chargeLabel.style.textAlign = "right";
		chargeLabel.style.width = "50px";
		el.appendChild(chargeLabel);

		var chargeInput = document.createElement("input");
		chargeInput.style.width = "3em";
		chargeInput.value = object.Charges;
		chargeInput.min = (typeof object.ChargesMin == "number") ? object.ChargesMin : 0;
		chargeInput.max = (typeof object.ChargesMax == "number") ? object.ChargesMax : 1000;
		chargeInput.type = "number";
		chargeInput.className = "mini-spinner";
		chargeInput.onchange = (function(e,u) {
			object.Charges = Number.parseInt(e.target.value);
			object.update()
		})
		el.appendChild(chargeInput);
		object.chargeInput = chargeInput

		el.appendChild(document.createElement("br"));
	}

	var statOrder = ["Strength", "Agility", "Intelligence", "Health", "Mana",
		"HealthRegeneration", "ManaRegenerationPercentage", "ManaRegenerationFlat",
		"Damage", "DamageBase", "DamagePercentage", "DamageReductionPercentage", "DamageReduction",
		"AttackSpeed", "MovementSpeed", "MovementSpeedPercentage",
		"MagicalResistance", "Evasion", "Armor", "AttackRate", "Range" ],
		statValues = {};

	for (var stat of statOrder)
		if (typeof object[stat] !== "undefined")
			statValues[stat] = object[stat];

	// handler for ItemInstance special stats
	if (object.Family)
		for (var stat in object.Family.Stats)
			statValues[stat] = object.Family.Stats[stat]

	//for (var stat in statValues) {
	for (var stat of statOrder) {
		if (statValues[stat] === undefined)
			continue;
		var readable = DotaData.statToReadable(stat, statValues[stat]),
			valueLabel = document.createElement("span");
			valueLabel.className = "item-display-options value";
			object.dynamicElements[stat] = valueLabel;
		if (readable.isPercentage)
			valueLabel.title = (statValues[stat] * object.heroRef.Total[readable.baseName]).toFixed(0);
		if (readable.negativeOverride === undefined && statValues[stat] < 0)
			valueLabel.classList.add("negative");
		else if (readable.negativeOverride && statValues[stat] > 0)
			valueLabel.classList.add("negative");
		valueLabel.textContent = readable.value;
		el.appendChild(valueLabel);
		var spanLabel = document.createElement("span");
			spanLabel.className = "item-display-options label";
			spanLabel.textContent = readable.key;
		el.appendChild(spanLabel);
		el.appendChild(document.createElement("br"));
	}

	if ( object.Cooldown ) {
		var cooldown = document.createElement("span")
		cooldown.className = "item-display-options cooldown";
		cooldown.textContent = object.Cooldown;
		el.appendChild(cooldown)
		object.cooldownElement = cooldown;
	}

	if ( object.ManaCost ) {
		var manacost = document.createElement("span")
		manacost.className = "item-display-options manacost";
		manacost.textContent = object.Cooldown;
		el.appendChild(manacost)
		object.manacostElement = manacost;
	}

	if ( object.ManaCost || object.Cooldown )
		el.appendChild(document.createElement("br"))

	if ( object.Warning ) {
		var warning = document.createElement("span")
		warning.className = "item-display-options warning"
		warning.textContent = object.Warning;
		el.appendChild(warning)
		el.appendChild(document.createElement("br"));
	}

	if ( object.Lore ) {
		var lore = document.createElement("span")
		lore.className = "item-display-options lore"
		lore.textContent = object.Lore
		el.appendChild(lore)
		el.appendChild(document.createElement("br"));
	}

	return el;
}

// Updates the HTML elements
ElementHelper.updateDisplayElements = function ( object ) {
	if (!object.displayElement)
		return;
	if ("Hidden" in object)
		if (object.Hidden == true) {
			object.displayElement.style.display = "none"
			return;
		}
		else
			object.displayElement.style.display = ""
	if (object.Image)
		if (object instanceof ItemInstance)
			object.displayElement.style.backgroundImage = "url(images/items/" + object.Image + ".png)";
		else
			object.displayElement.style.backgroundImage = "url(images/abilities/" + object.Image + ".png)";
	if (object.chargeElement)
		object.chargeElement.textContent = object.Charges;
	if (object.chargeInput) {
		object.chargeInput.value = object.Charges;
		if (typeof object.ChargesMin == "number")
			object.chargeInput.min = object.ChargesMin;
		if (typeof object.ChargesMax == "number")
			object.chargeInput.max = object.ChargesMax;
	}

	if (object.levelElement)
		object.levelElement.textContent = DotaData.numericToRoman(object.Level);
	for (var stat in object.dynamicElements) {
		var statValue = stat in object ? object[stat] : object.Family.Stats[stat];
		var readable = DotaData.statToReadable(stat, statValue);
		var dynElement = object.dynamicElements[stat]
		dynElement.textContent = readable.value;
		if (readable.isPercentage)
			dynElement.title = (statValue * object.heroRef.Total[readable.baseName+"Base"]).toFixed(2);
		if (readable.negativeOverride === undefined)
			if (statValue < 0)
				dynElement.classList.add("negative");
			else
				dynElement.classList.remove("negative");
		else if (readable.negativeOverride)
			if (statValue > 0)
				dynElement.classList.add("negative");
			else
				dynElement.classList.remove("negative");
	}
	if (object.cooldownElement)
		if (object.Level === 0)
			object.cooldownElement.style.display = "none"
		else {
			object.cooldownElement.style.display = ""
			object.cooldownElement.textContent = object.Cooldown
		}
	if (object.manacostElement)
		if (object.Level === 0)
			object.manacostElement.style.display = "none"
		else {
			object.manacostElement.style.display = ""
			object.manacostElement.textContent = object.ManaCost
		}
}




