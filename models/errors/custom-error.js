'use strict';

global.EnumValidationError = class EnumValidationError extends Error {
    constructor(message , field , allowedValues , enteredValue) {
        super(message);
        this.name = "EnumValidationError";
        this.message = message;
        this.field = field;        
        this.allowedValues = allowedValues;
        this.enteredValue = enteredValue;
    }
 }
