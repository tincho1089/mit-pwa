import { AbstractControl } from "@angular/forms";
import { FAIL_TEST_MSG } from "./steam-trubine-ost-trip-test.model";

export function ValidateTestCase(control: AbstractControl) {
    if (control.value == FAIL_TEST_MSG) {
        return { InvalidTest: 'OST Test Failure' };
    }
    return null;
}