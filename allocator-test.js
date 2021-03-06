class AllocatedMember {
    constructor() {
        console.log('Calling AllocatedMember constructor.');
    }

    static SHOULD_NOT_HAVE = false;

    value = 0;
    testArray = [0, 1, 2];
    pointer = null;
}

class DumbBase {
    baseMethod() {
        console.log('Base method generic name is: ', this.genericName);
    }
}

class GenericComponent extends DumbBase {
    genericName = 'Default Name';

    method() {
        console.log('My generic name is: ', this.genericName);
    }
}

const AllocatedMemberAllocator = Allocator.create(
    new AllocatedMember(),
    2);

class SpecificComponent extends GenericComponent {
    specificName = 'Default Name';
    allocatedMember = new AllocatedMember();
    intValue = 2;
    floatValue = 1.1;
    boolValue = true;
    time = 0;
}

const SpecificAllocator = Allocator.create(
    new SpecificComponent());

AllocatedMemberAllocator.initialize(
    (entry) => {
        entry.value = 1;
        entry.testArray = [0, 1, 2];
    },
    (entry, value) => {
        entry.value = value;
        entry.testArray[0] = 1;
        entry.testArray[1] = 2;
        entry.testArray[2] = 3;
    },
    null);

SpecificAllocator.initialize(
    (entry) => {
        // string defaults don't matter
        entry.genericName = 'Generic Name';
        entry.specificName = 'Default Name';
        entry.allocatedMember = Allocator.NULL;
        entry.intValue = 2;
        entry.floatValue = 1.1;
        entry.boolValue = true;
    },
    (entry, genericName, defaultName) => {
        console.log(entry, genericName, defaultName);
        entry.genericName = genericName;
        entry.specificName = defaultName;
        entry.allocatedMember = AllocatedMemberAllocator.claim(5);
        entry.intValue = 2;
        entry.floatValue = 1.1;
        entry.boolValue = true;
        console.log('time is ', Date.now());
        entry.time = Date.now();
    }, (entry) => {
        entry.allocatedMember.free();
    });

console.log('Claiming specificInstance1');
const specificInstance1 = SpecificAllocator.claim('generic name!', 'default name!');
console.log('Getting specificInstance1.time', specificInstance1.time);
console.log('Setting specificInstance1.floatValue 1.2');
specificInstance1.floatValue = 1.2;
console.log('Getting specificInstance1.floatValue', specificInstance1.floatValue);
console.log(specificInstance1.allocatedMember);
console.log('Getting specificInstance1.genericName', specificInstance1.genericName);
console.log('Getting specificInstance1.allocatedMember.value', specificInstance1.allocatedMember.value);
console.log('Getting specificInstance1.genericName', specificInstance1.genericName);
console.log('Calling specificInstance1.method()');
specificInstance1.method();
console.log('Setting specificInstance1.genericName');
specificInstance1.genericName = 'new generic name!';
console.log('Calling specificInstance1.method()');
specificInstance1.method();
console.log('Getting specificInstance1.genericName', specificInstance1.genericName);
console.log('Setting specificInstance1.allocatedMember.value 1');
specificInstance1.allocatedMember.value = 1;
console.log('Getting specificInstance1.allocatedMember.value', specificInstance1.allocatedMember.value);
console.log('Getting specificInstance1.allocatedMember.testArray', specificInstance1.allocatedMember.testArray);
console.log('Claiming specificInstance2');
const specificInstance2 = SpecificAllocator.claim('generic name 2!', 'default name 2!');
console.log('Getting specificInstance2.time', specificInstance2.time);
console.log('Getting specificInstance2.allocatedMember.value', specificInstance2.allocatedMember.value);
console.log('Setting specificInstance2.allocatedMember.value 2');
specificInstance2.allocatedMember.value = 2;
console.log('Getting specificInstance2.allocatedMember.value', specificInstance2.allocatedMember.value);
console.log('Getting specificInstance1.allocatedMember.value', specificInstance1.allocatedMember.value);
console.log('Claiming specificInstance3, which will resize the AllocatedMemberAllocator');
const specificInstance3 = SpecificAllocator.claim('generic name 3!', 'default name 3!');
console.log('Getting specificInstance3.time', specificInstance3.time);
console.log('Claiming specificInstance4');
const specificInstance4 = SpecificAllocator.claim('generic name 4!', 'default name 4!');
console.log('Getting specificInstance4.time', specificInstance4.time);
console.log('Freeing specificInstance2');
SpecificAllocator.free(specificInstance2);
console.log('Claiming specificInstance5, which should NOT resize AllocatedMemberAllocator');
const specificInstance5 = SpecificAllocator.claim('generic name 5!', 'default name 5!');
console.log('Getting specificInstance5.time', specificInstance5.time);

// const SPECIFIC_ALLOCATOR = new Allocator(new SpecificComponent());
//
// SPECIFIC_ALLOCATOR.floatValue[0];

