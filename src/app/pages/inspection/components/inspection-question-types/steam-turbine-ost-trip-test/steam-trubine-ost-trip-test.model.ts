export const GovernorTypes = {
    'NemaA': 'NEMA A (Woodward TG or less)',
    'NemaD': 'NEMA D (Electronic or Woodward PG)'
}
export const GovernorTypeOptions = [
    { "value": GovernorTypes.NemaA, "description": GovernorTypes.NemaA },
    { "value": GovernorTypes.NemaD, "description": GovernorTypes.NemaD }
];

export const OSTLimits = {
    Rdl: 0.99,
    Rdh: 1.01,
    Ral: 0.98,
    Rah: 1.02
}

export const OSTDeltas = {
    Ddl: 0.9975,
    Ddh: 1.0025,
    Dal: 0.9925,
    Dah: 1.0075,
}

export const SUCCESSFUL_TEST_MSG = "Successful OST Test";
export const FAIL_TEST_MSG = "OST Test Failure";

