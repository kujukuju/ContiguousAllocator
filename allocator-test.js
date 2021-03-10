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
    null,
    2);

class SpecificComponent extends GenericComponent {
    specificName = 'Default Name';
    allocatedMember = new AllocatedMember();
    intValue = 2;
    floatValue = 1.1;
    boolValue = true;
}

const SpecificAllocator = Allocator.create(
    new SpecificComponent(),
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
        entry.genericName = genericName;
        entry.specificName = defaultName;
        entry.allocatedMember = AllocatedMemberAllocator.claim(5);
        entry.intValue = 2;
        entry.floatValue = 1.1;
        entry.boolValue = true;
    }, (entry) => {
        entry.allocatedMember.free();
    });

console.log('Claiming specificInstance1');
const specificInstance1 = SpecificAllocator.claim('generic name!', 'default name!');
console.log('Getting specificInstance1.allocatedMember.value', specificInstance1.allocatedMember.value);
console.log('Getting specificInstance1.genericName', specificInstance1.genericName);
console.log('Calling specificInstance1.method()', specificInstance1.method);
specificInstance1.method()
console.log('Setting specificInstance1.genericName');
specificInstance1.genericName = 'new generic name!';
console.log('Calling specificInstance1.method()');
specificInstance1.method()
console.log('Getting specificInstance1.genericName', specificInstance1.genericName);
console.log('Setting specificInstance1.allocatedMember.value');
specificInstance1.allocatedMember.value = 1;
console.log('Getting specificInstance1.allocatedMember.value', specificInstance1.allocatedMember.value);
console.log('Getting specificInstance1.allocatedMember.testArray', specificInstance1.allocatedMember.testArray);
console.log('Claiming specificInstance2');
const specificInstance2 = SpecificAllocator.claim('generic name 2!', 'default name 2!');
console.log('Getting specificInstance2.allocatedMember.value', specificInstance2.allocatedMember.value);
console.log('Setting specificInstance2.allocatedMember.value');
specificInstance2.allocatedMember.value = 2;
console.log('Getting specificInstance2.allocatedMember.value', specificInstance2.allocatedMember.value);
console.log('Getting specificInstance1.allocatedMember.value', specificInstance1.allocatedMember.value);
console.log('Claiming specificInstance3, which will resize the AllocatedMemberAllocator');
const specificInstance3 = SpecificAllocator.claim('generic name 3!', 'default name 3!');
console.log('Claiming specificInstance4');
const specificInstance4 = SpecificAllocator.claim('generic name 4!', 'default name 4!');
console.log('Freeing specificInstance2');
SpecificAllocator.free(specificInstance2);
console.log('Claiming specificInstance5, which should NOT resize AllocatedMemberAllocator');
const specificInstance5 = SpecificAllocator.claim('generic name 5!', 'default name 5!');

// const SPECIFIC_ALLOCATOR = new Allocator(new SpecificComponent());
//
// SPECIFIC_ALLOCATOR.floatValue[0];

const test = {x: 2};

class Again {
    x = 3;

    blah() {
        console.log(this.x);
    }
}

const again = new Again();
again.blah.bind(test)();

