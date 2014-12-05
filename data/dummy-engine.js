var DummyFormFiller = {};

DummyFormFiller = (function() {
	var engine = {};

	engine.populateDummyData = function() {
		var $here = $('html');

		$.each($here.find('input, select, textarea'), function() {
			populateElementIfNotSetYet($(this), $here);
		});
	}

	var DEI_KOBOL = 'Dei Kobol una apita uthoukarana ' + 'Ukthea mavatha gaman kerimuta '
			+ 'Obe satharane mua osavathamanabanta ' + 'Api obata yagnya karama'
			+ 'ph\'nglui mglw\'nafh Cthulhu R\'lyeh wgah\'nagl fhtagn';

	var LETTERS = "abcdefghijklmnopqrstuvwxyz";

	var dummyEmail = chance.email();
	var excludedNames = [];

	/**
	 * Populates given element with a dummy value within parent's scope. Does
	 * not modify already populated element or element's family (that is defined
	 * by the 'name' attribute). Tries to figure out element's purpose, e.g.
	 * age, year. Ensures the value meets element's limitations, e.g. min,
	 * minlength.
	 */
	function populateElementIfNotSetYet($element, $topParent) {
		if ($element.is('[type=text]')) {
			if (isEmpty($element) && isVisible($element) && isEnabled($element)) {
				populateWithRandomTextWisely($element);
			}
		} else if ($element.is('[type=email]')) {
			if (isEmpty($element) && isVisible($element) && isEnabled($element)) {
				$element.val(dummyEmail);
			}
		} else if ($element.is('[type=url]')) {
			if (isEmpty($element) && isVisible($element) && isEnabled($element)) {
				$element.val('http://' + chance.domain());
			}
		} else if ($element.is('[type=radio]')) {
			var groupName = $element.prop('name');
			if (isEnabled($element) && !isExcluded(groupName)) {
				var $radioInputs = findVisibleEnabledInputsByTypeAndName($topParent, 'radio', groupName);
				if (!isAnyInputChecked($radioInputs)) {
					clickRandomInput($radioInputs);
				}
				excludedNames.push(groupName);
			}
		} else if ($element.is('[type=checkbox]')) {
			var groupName = $element.prop('name');
			if (isVisible($element) && isEnabled($element) && !isExcluded(groupName)) {
				var $checkboxInputs = findVisibleEnabledInputsByTypeAndName($topParent, 'checkbox', groupName);
				if (!isAnyInputChecked($checkboxInputs)) {
					clickRandomInputs($checkboxInputs);
				}
				excludedNames.push(groupName);
			}
		} else if ($element.is('[type=password]')) {
			$element.val("0Pa$$4uM^t3");
		} else if ($element.is('select')) {
			if (isVisible($element) && isEnabled($element)) {
				clickRandomOptionOrOptions($element);
			}
		} else if ($element.is('[type=number]')) {
			if (isEmpty($element) && isVisible($element) && isEnabled($element)) {
				populateWithRandomNumberWisely($element);
			}
		} else if ($element.is('[type=date]')) {
			if (isEmpty($element) && isVisible($element) && isEnabled($element)) {
				populateWithRandomDateWisely($element);
			}
		} else if ($element.is('[type=tel]')) {
			if (isEmpty($element) && isVisible($element) && isEnabled($element)) {
				$element.val(getDummyPhone());
			}
		} else if ($element.is('textarea')) {
			if (isEmpty($element) && isVisible($element) && isEnabled($element)) {
				$element.val(chance.paragraph());
			}
		}
	}

	/*
	 * ################ # MANIPULATORS # ################
	 */
	function clickRandomInput($elements) {
		$(chance.pick($elements)).click();
	}

	function clickRandomInputs($elements) {
		var randomBoolean;
		$.each($elements, function() {
			if (chance.bool() && isVisible($(this)) && isEnabled($(this))) {
				$($(this)).click();
			}
		});
	}
	/**
	 * Selects one option or, if 'multiple', random number of options. Does not
	 * select single option if currently selected index higher than 0. Does not
	 * select multiple options if any already selected.
	 */
	function clickRandomOptionOrOptions($select) {
		if ($select.prop('multiple')) {
			if (isEmpty($select)) {
				$select.find('option').each(function() {
					$(this).prop("selected", chance.bool());
				});
			}
		} else {
			if ($select.prop("selectedIndex") <= 0) {
				$(chance.pick($select.find('option'))).prop("selected", true);
			}
		}
	}

	/**
	 * Populates given input with random text or readdresses the task to more
	 * appropriate populator. Considers: - min and max properties - name and
	 * label to guess input's role, e.g. age, year
	 */
	function populateWithRandomTextWisely($input) {
		var inputPurpose = defineInputPurpose($input);
		var limits = defineLimits($input);

		switch (inputPurpose) {
		case PHONE_PURPOSE:
		case AGE_PURPOSE:
		case YEAR_PURPOSE:
			populateWithRandomNumberWisely($input, inputPurpose);
			break;
		case UNDEFINED_PURPOSE:
		default:
			$input.val(getDummyText());
		}
	}

	/**
	 * Populates given input with random number. Considers: - min and max
	 * properties - name and label to guess input's role, e.g. age, year
	 */
	function populateWithRandomNumberWisely($input, inputPurpose) {
		inputPurpose = (typeof inputPurpose !== 'undefined') ? inputPurpose : defineInputPurpose($input);
		var limits = defineLimits($input);

		switch (inputPurpose) {
		case PHONE_PURPOSE:
			$input.val(getDummyPhone());
			break;
		case AGE_PURPOSE:
			var ageLimits = getOrCreateMinAndMaxLimits(AGE_PURPOSE, limits);
			$input.val(getDummyNumber(ageLimits));
			break;
		case YEAR_PURPOSE:
			var yearLimits = getOrCreateMinAndMaxLimits(YEAR_PURPOSE, limits);
			$input.val(getDummyNumber(yearLimits));
			break;
		case UNDEFINED_PURPOSE:
		default:
			$input.val(getDummyNumber(limits));
		}
	}

	/**
	 * Populates given input with random date. Considers: - min and max properties
	 */
	function populateWithRandomDateWisely($input, inputPurpose) {
		var limits = defineLimits($input);
		var yearLimits = getOrCreateMinAndMaxLimits(YEAR_PURPOSE, limits);
		var date = chance.date({min: MIN_LIMIT in limits ? new Date(limits[MIN_LIMIT]) : undefined, max: MAX_LIMIT in limits ? new Date(limits[MAX_LIMIT]) : undefined});
		$input.val(date.toISOString().split('T')[0]);
	}

	/*
	 * ################ ### HELPERS #### ################
	 */

	/** Input purposes */
	var UNDEFINED_PURPOSE = 'undefined_purpose';
	var PHONE_PURPOSE = 'phone_purpose';
	var AGE_PURPOSE = 'age_purpose';
	var YEAR_PURPOSE = 'year_purpose';
	var NAME_PURPOSE = 'name_purpose';
	var POSTCODE_PURPOSE = 'postcode_purpose';

	/** Limit types */
	var MINLENGTH_LIMIT = 'minlength_limit';
	var MAXLENGTH_LIMIT = 'maxlength_limit';
	var MIN_LIMIT = 'min_limit';
	var MAX_LIMIT = 'max_limit';

	/**
	 * Checks if 'limits' contains min and max values. If yes, they are
	 * returned. Otherwise new values are created for provided purpose.
	 */
	function getOrCreateMinAndMaxLimits(purpose, limits) {

		if (MIN_LIMIT in limits && MAX_LIMIT in limits) {
			return limits;
		}

		var min = 1;
		var max = 100;
		var limitsToReturn = {};

		if (AGE_PURPOSE === purpose) {
			min = 21;
			max = 75;
		} else if (YEAR_PURPOSE === purpose) {
			min = 1940;
			max = 2015;
		}

		if (!(MIN_LIMIT in limits) && !(MAX_LIMIT in limits)) {
			limitsToReturn[MIN_LIMIT] = min;
			limitsToReturn[MAX_LIMIT] = max;
			return limitsToReturn;
		}

		if (MIN_LIMIT in limits) {
			limitsToReturn[MIN_LIMIT] = limits[MIN_LIMIT];
		} else {
			limitsToReturn[MIN_LIMIT] = min < limits[MAX_LIMIT] ? min : limits[MAX_LIMIT];
		}

		if (MAX_LIMIT in limits) {
			limitsToReturn[MAX_LIMIT] = limits[MAX_LIMIT];
		} else {
			limitsToReturn[MAX_LIMIT] = max > limits[MIN_LIMIT] ? max : limits[MIN_LIMIT];
		}

		return limitsToReturn;
	}

	function isEmpty($element) {
		return !$.trim($element.val());
	}

	function isVisible($element) {
		return $element.is(":visible");
	}

	function isEnabled($element) {
		return $element.is(":enabled");
	}

	function isAnyInputChecked($inputs) {
		var anyInputChecked = false;

		$inputs.each(function() {
			if ($(this).is(':checked')) {
				anyInputChecked = true;
				return false; // breaks the loop
			}
		});

		return anyInputChecked;
	}

	/**
	 * Returns an array of limits, i.e.: - min/max length - min/max value
	 */
	function defineLimits($element) {
		var limits = {};
		var minlength = $element.attr('minlength');
		var maxlength = $element.attr('maxlength');
		var min = $element.attr('min');
		var max = $element.attr('max');

		if (minlength) {
			limits[MINLENGTH_LIMIT] = minlength;
		}
		if (maxlength) {
			limits[MAXLENGTH_LIMIT] = maxlength;
		}
		if (min) {
			limits[MIN_LIMIT] = min;
		}
		if (max) {
			limits[MAX_LIMIT] = max;
		}
		if (max && min && $element.attr('type') == 'date' && (new Date(min) > new Date(max))) {
			delete limits[MIN_LIMIT];
			delete limits[MAX_LIMIT];
		}

		logInfo($element, 'limits', limits);

		return limits;
	}

	/**
	 * Considers: - min and max properties - name and label to guess input's
	 * role, e.g. age, year
	 */
	function defineInputPurpose($input) {
		var purposeByLabel = defineInputPurposeByLabel($input);

		if (typeof purposeByLabel !== UNDEFINED_PURPOSE) {
			logInfo($input, 'purpose', purposeByLabel);
			return purposeByLabel;
		}

		return UNDEFINED_PURPOSE;
	}

	function containsText(searchFor, inString) {
		return inString.toLowerCase().indexOf(searchFor) >= 0;
	}

	/**
	 * Considers label text: - phone - age - year
	 */
	function defineInputPurposeByLabel($input) {
		var labelText = '';

		if ($input.prop('id')) {
			labelText = $('label[for="' + $input.prop('id') + '"]').text();
		}

		if (containsText('phone', labelText)) {
			return PHONE_PURPOSE;
		} else if (containsText('age', labelText)) {
			return AGE_PURPOSE;
		} else if (containsText('year', labelText)) {
			return YEAR_PURPOSE;
		}

		return UNDEFINED_PURPOSE;
	}

	function findInputsByTypeAndName($here, type, name) {
		return $here.find('input[type=' + type + '][name="' + name + '"]');
	}

	function findVisibleEnabledInputsByTypeAndName($here, type, name) {
		return $here.find('input[type=' + type + '][name="' + name + '"]:visible:enabled');
	}

	function isExcluded(groupName) {
		return $.inArray(groupName, excludedNames) !== -1;
	}

	/*
	 * ################ ## GENERATORS ## ################
	 */

	/**
	 * Returns random number that meets given limitations, i.e. min and max
	 * values.
	 */
	function getDummyNumber(limits) {
		if (typeof limits === 'undefined') {
			return chance.natural({
				max : 500
			});
		}

		var min = Number(limits[MIN_LIMIT]);
		var max = Number(limits[MAX_LIMIT]);

		if (min > max) {
			return -1
		}
		return chance.natural({
			min : min,
			max : max
		});
	}

	/**
	 * Returns random text of a length of 5 to 10 characters. First letter
	 * uppercased.
	 */
	function getDummyText() {
		var text = $.trim(chance.string({
			length : chance.natural({
				min : 5,
				max : 10
			}),
			pool : DEI_KOBOL
		}));
		return chance.capitalize(text);
	}

	/**
	 * Returns random phone number.
	 */
	function getDummyPhone() {
		return chance.phone({
			formatted : false
		});
	}

	/**
	 * Prints information next to the given element. Doesn't log if there's
	 * nothing to show.
	 */
	function logInfo($element, key, value) {
		if ((value && typeof value !== 'object') || (typeof value === 'object' && Object.keys(value).length !== 0)) {
			console.log('Element id=\'' + $element.prop('id') + '\'\t- ' + key + ': ' + JSON.stringify(value, null, 4));
		}
	}

	return engine;
}());
