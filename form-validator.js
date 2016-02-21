/**
 * Returns the classes of HTML element as list.
 *
 * @param element HTML element.
 *
 * @return List of classes of the element.
 */
function element_get_class_list(element) {
	return element.className == undefined ? [] : element.className.split(' ');
}

/**
 * Sets the list of classes to HTML element.
 *
 * @param element HTML element.
 * @param classList List of classes to set.
 */
function element_set_class_list(element, classList) {
	var newClassName = '';
	for (var i = 0; i < classList.length; i++) {
		if (classList[i] != '')
			newClassName += classList[i] + ' ';
	}

	element.className = newClassName;
}

function element_has_class(element, className) {
	var classList = element_get_class_list(element);

	for (var i = 0; i < classList.length; i++) {
		if (classList[i] == className)
			return true;
	}

	return false;
}

/**
 * Removes the class from HTML element.
 *
 * @param element HTML element.
 * @param className The class to remove.
 */
function element_remove_class(element, className) {
	var classList = element_get_class_list(element);

	for (var i = classList.length - 1; i >= 0; i--) {
		if (classList[i] == className)
			classList.splice(i, 1);
	}

	element_set_class_list(element, classList);
}

/**
 * Adds the class to HTML element.
 *
 * @param element HTML element.
 * @param className The class to add.
 */
function element_add_class(element, className) {
	if (element_has_class(element, className))
		return;

	var classList = element_get_class_list(element);
	classList.push(className);
	element_set_class_list(element, classList);
}

/**
 * Creates Field object that represents the logic of input text field.
 * The field has initial minimum length of 1, unlimited maximum length, no regular
 * expression and is required.
 *
 * @param node HTML element of the field.
 * @param parent_form Form object of the form this field is in.
 *
 * @return New Field object.
 */
function Field(node, parent_form) {
	this.node = node;
	this._min_length = 1;
	this._max_length = -1; // -1 means no upper limit
	this._regex = null;
	this._required = true;

	this.is_valid = false;

	/**
	 * Sets the minimum length of the input.
	 *
	 * @param length The new minimum length.
	 *
	 * @return The object itself.
	 */
	this.min_length = function(length) {
		this._min_length = length;
		return this;
	}

	/**
	 * Sets the maximum length of the input.
	 *
	 * @param length The new maximum length.
	 *
	 * @return The object itself.
	 */
	this.max_length = function(length) {
		this._max_length = length;
		return this;
	}

	/**
	 * Sets the regular expression that is matched against the input.
	 *
	 * @param regex The regular expression to set.
	 *
	 * @return The object itself.
	 */
	this.regex = function(regex) {
		this._regex = regex;
		return this;
	}

	/**
	 * Sets the field as required.
	 *
	 * @return The object itself.
	 */
	this.required = function() {
		this._required = true;
		this.is_valid = false;
		return this;
	}

	/**
	 * Sets the field as optional.
	 *
	 * @return The object itself.
	 */
	this.optional = function() {
		this._required = false;
		this.is_valid = true;
		return this;
	}

	/**
	 * Makes the field valid, by marking it with 'valid' class and removing 'invalid' class.
	 */
	this.make_valid = function() {
		element_remove_class(this.node, 'invalid');
		element_add_class(this.node, 'valid');
		this.is_valid = true;
	}

	/**
	 * Makes the field invalid, by marking it with 'invalid' class and removing 'valid' class.
	 */
	this.make_invalid = function() {
		element_remove_class(this.node, 'valid');
		element_add_class(this.node, 'invalid');
		this.is_valid = false;
	}

	/**
	 * Unmarks the field from valid/invalid state. This is used for optional field, if their
	 * input is empty. The field seems valid from the outside.
	 */
	this.make_default = function() {
		element_remove_class(this.node, 'valid');
		element_remove_class(this.node, 'invalid');
		this.is_valid = true;
	}

	/**
	 * Validates the value of the field and marks the field as valid or invalid, based on the rules.
	 */
	this.validate = function() {
		var value = this.node.value; // Value in the text field.

		// Undefined value in the beginning, later on it is empty string.
		if (value == null || value == undefined || value == '') {
			this._required ? this.make_invalid() : this.make_default();
			return;
		}

		// Minimum length check.
		if (value.length < this._min_length) {
			this.make_invalid();
			return;
		}

		// Maximum length check.
		if (this._max_length != -1 && value.length > this._max_length) {
			this.make_invalid();
			return;
		}

		// Regex check, it must full match.
		if (this._regex != null) {
			var match = value.match(field._regex);
			if (match == null || match[0] != value) {
				this.make_invalid();
				return;
			}
		}

		this.make_valid();
		return;
	}

	// Handler for onInput event
	var field = this;
	this.node.oninput = function() {
		field.validate();
		parent_form.validate_submits(); // Form may be all valid now, so validate submit buttons
	}
}

/**
 * Creates a new Submit object, which represents the logic of submit input
 * controls associated with the form. Submit can have set to be enabled
 * always, if the form is valid of if the form is invalid. Default setting is
 * enabled if the form is valid.
 *
 * @param node HTML element of submit control.
 *
 * @return Newly created Submit object.
 */
function Submit(node) {
	var EnabledEnum = {
		'always' : 0,
		'if_valid' : 1,
		'if_invalid' : 2
	};

	this.node = node;
	this.enabled_if = EnabledEnum.if_valid;

	/**
	 * Makes the submit control enabled.
	 */
	this.make_enabled = function() {
		element_remove_class(this.node, 'invalid');
		element_add_class(this.node, 'valid');
		this.node.disabled = false;
	}

	/**
	 * Makes the submit control disabled.
	 */
	this.make_disabled = function() {
		element_remove_class(this.node, 'valid');
		element_add_class(this.node, 'invalid');
		this.node.disabled = true;
	}

	/**
	 * Sets the submit control enabled always.
	 */
	this.enabled_always = function() {
		this.enabled_if = EnabledEnum.always;
	}

	/**
	 * Sets the submit control enabled if the form is valid.
	 */
	this.enabled_if_valid = function() {
		this.enabled_if = EnabledEnum.if_valid;
	}

	/**
	 * Sets the submit control enabled if the form is invalid.
	 */
	this.enabled_if_invalid = function() {
		this.enabled_if = EnabledEnum.if_invalid;
	}

	/**
	 * Validates the submit control and enables/disables it according to the
	 * form validness.
	 *
	 * @param form_valid True if form is valid, otherwise false.
	 */
	this.validate = function(form_valid) {
		switch (this.enabled_if) {
			case EnabledEnum.always:
				this.make_enabled();
				break;
			case EnabledEnum.if_valid:
				form_valid ? this.make_enabled() : this.make_disabled();
				break;
			case EnabledEnum.if_invalid:
				form_valid ? this.make_disabled() : this.make_enabled();
				break;
		}
	}
}

/**
 * Creates Form object that is associated with form in the page HTML. May cause
 * error if form with given id is not found.
 *
 * @param id Id of the form.
 *
 * @return Newly created Form object.
 */
function Form(id) {
	this.id = id;
	this.element = document.getElementById(id);
	if (this.element == undefined) {
		console.log('No form with id \'' + id + '\' found.');
		return;
	}

	this.fields = {}
	this.submits = {}

	// Find all descendants that are input text controls
	var inputFields = this.element.querySelectorAll('input[type="text"]');
	for (var i = 0; i < inputFields.length; i++) {
		if (inputFields[i].name != '')
			this.fields[inputFields[i].name] = new Field(inputFields[i], this);
	}

	// Find all descendants that are input submit controls
	var submits = this.element.querySelectorAll('input[type="submit"]');
	for (var i = 0; i < submits.length; i++) {
		if (submits[i].name != '')
			this.submits[submits[i].name] = new Submit(submits[i]);
	}

	/**
	 * Returns the field with a given name if it exists. May cause
	 * error if field with given name is not found.
	 *
	 * @param name Name of the text field.
	 *
	 * @return Field object if it exists.
	 */
	this.field = function(name) {
		if (this.fields[name] == undefined)
		{
			console.log('No text input field named \'' + name + '\' found.');
			return;
		}

		return this.fields[name]
	}

	/**
	 * Returns the submit with a given name if it exists. May cause
	 * error if submit with given name is not found.
	 *
	 * @param name Name of the submit.
	 *
	 * @return Submit object if it exists.
	 */
	this.submit = function(name) {
		if (this.submits[name] == undefined)
		{
			console.log('No submit named \'' + name + '\' found.');
			return;
		}

		return this.submits[name]
	}

	/**
	 * Validate all text fields and mark/color them properly.
	 */
	this.validate_fields = function() {
		for (var name in this.fields) {
			if (this.fields.hasOwnProperty(name)) {
				this.fields[name].validate();
			}
		}
	}

	/**
	 * Validate all submit controls and enable/disable them properly.
	 */
	this.validate_submits = function() {
		// First check whether form is valid based on the data in text fields.
		var is_form_valid = true;
		for (var name in this.fields) {
			if (this.fields.hasOwnProperty(name)) {
				if (!this.fields[name].is_valid) {
					is_form_valid = false;
					break;
				}
			}
		}

		// Then enable/disable submit controls.
		for (var name in this.submits) {
			if (this.submits.hasOwnProperty(name)) {
				this.submits[name].validate(is_form_valid);
			}
		}
	}
}

/**
 * FormValidator module, used to setup form validation process.
 */
var FormValidator = function() {
	var forms = [];

	/**
	 * Adds new form to form validation process.
	 *
	 * @param form Form object of the form to validate.
	 */
	var add_form = function(form) {
		forms.push(form);
	}

	/**
	 * Validates all forms that are registered for validation.
	 */
	var validate_all = function() {
		for (var i = 0; i < forms.length; i++) {
			forms[i].validate_fields();
			forms[i].validate_submits();
		}
	}

	return {
		add_form : add_form,
		validate_all : validate_all
	}
}();

// Initial validation
document.onreadystatechange = function() {
	if (document.readyState == "interactive") {
		FormValidator.validate_all();
	}
}
