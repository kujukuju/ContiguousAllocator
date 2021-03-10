class Allocated {
    _blockSize;
    _pointerCount;

    _buffer;
    _floatBuffer;
    _intBuffer;

    _type;
    _count;

    _constructor;
    _claimer;
    _deconstructor;

    _pointerList;
    _methods;

    _nextAvailableIndex;
    // the list of actual accessors that you return to the user
    _accessors;

    _accessorClass;

    constructor(type, constructor, claimer, deconstructor, count) {
        const [valueCount, pointerCount] = Allocated._getAllocationTypeCounts(type);

        this._blockSize = valueCount + 1;
        this._pointerCount = pointerCount;

        this._buffer = new ArrayBuffer(this._blockSize * count * 4);
        this._floatBuffer = new Float32Array(this._buffer);
        this._intBuffer = new Int32Array(this._buffer);

        this._type = type;
        this._count = count;

        this._constructor = constructor;
        this._claimer = claimer;
        this._deconstructor = deconstructor;

        this._pointerList = new Array(this._pointerCount * count);
        this._methods = Allocated._getMethods(type);

        this._nextAvailableIndex = 0;
        this._accessors = new Array(count);

        this._accessorClass = this._constructAccessorClass(type);

        this._constructElements(0, count);
    }

    claim(...args) {
        if (this._nextAvailableIndex === -1) {
            const newCount = this._count * 2;

            const newBuffer = new ArrayBuffer(this._blockSize * newCount * 4);
            const newIntBuffer = new Int32Array(newBuffer);
            const newFloatBuffer = new Float32Array(newBuffer);

            newIntBuffer.set(this._buffer);

            this._buffer = newBuffer;
            this._intBuffer = newIntBuffer;
            this._floatBuffer = newFloatBuffer;

            this._pointerList.length = this._pointerCount * newCount;
            this._accessors.length = newCount;

            this._constructElements(this._count, newCount);

            this._nextAvailableIndex = this._count;
            this._count = newCount;
        }

        const index = this._nextAvailableIndex;
        this._nextAvailableIndex = this._intBuffer[this._nextAvailableIndex * this._blockSize];

        this._claimer(this._accessors[index], ...args);

        return this._accessors[index];
    }

    free(instance) {
        if (this._deconstructor) {
            this._deconstructor(instance);
        }

        const index = instance.__index;

        const oldNextAvailableIndex = this._nextAvailableIndex;
        this._nextAvailableIndex = index;

        this._intBuffer[index * this._blockSize] = oldNextAvailableIndex;
    }

    _accessInstance(index) {
        return this._accessors[index];
    }

    _constructAccessorClass(type) {
        // the first index is the pointer to the next available space
        let propertyOffset = 1;
        let objectListIndex = 0;

        const self = this;
        const blockSize = this._blockSize;
        const pointerCount = this._pointerCount;

        const Accessor = function() {};
        Accessor.prototype.__index = 0;
        Accessor.prototype.free = function() {
            self.free.bind(self, this);
        }

        console.log(this._methods);

        console.log(Object.getOwnPropertyNames(Accessor.prototype));

        for (let a = 0; a < this._methods.length; a++) {
            if (Accessor.prototype.hasOwnProperty(this._methods[a])) {
                console.error('You cannot have a method on an allocated object named \'' + this._methods[a] + '\'. ', this._type.constructor.name);
                continue;
            }

            Accessor.prototype[this._methods[a]] = self._type[self._methods[a]];
        }

        const properties = Object.getOwnPropertyNames(type);
        for (let a = 0; a < properties.length; a++) {
            const propertyName = properties[a];

            const nullptr = type[propertyName] === undefined || type[propertyName] === null;

            const propertyType = nullptr ? 'object' : typeof (type[propertyName]);
            const className = nullptr ? null : type[propertyName].constructor.name;

            if (Accessor.prototype.hasOwnProperty(propertyName)) {
                console.error('You cannot have a property on an allocated object named \'' + propertyName + '\'. ', className, propertyType);
                continue;
            }

            switch (propertyType) {
                case 'number': {
                    Object.defineProperty(Accessor.prototype, propertyName, {
                        enumerable: false,
                        configurable: false,
                        get: function() {
                            return self._floatBuffer[this.__index * blockSize + propertyOffset];
                        },
                        set: function(value) {
                            self._floatBuffer[this.__index * blockSize + propertyOffset] = value;
                        },
                    });

                    propertyOffset++;
                } break;

                case 'boolean': {
                    Object.defineProperty(Accessor.__proto__, propertyName, {
                        enumerable: false,
                        configurable: false,
                        get: function() {
                            return !!self._intBuffer[this.__index * blockSize + propertyOffset];
                        },
                        set: function(value) {
                            self._intBuffer[this.__index * blockSize + propertyOffset] = value ? 1 : 0;
                        },
                    });

                    propertyOffset++;
                } break;

                case 'string': {
                    Object.defineProperty(Accessor.prototype, propertyName, {
                        enumerable: false,
                        configurable: false,
                        get: function() {
                            return self._pointerList[this.__index * pointerCount + objectListIndex];
                        },
                        set: function(value) {
                            self._pointerList[this.__index * pointerCount + objectListIndex] = value;
                        },
                    });

                    objectListIndex++;
                } break;

                case 'object': {
                    const allocated = className ? Allocator.hasByName(className) : false;
                    if (allocated) {
                        const allocatorIndex = Allocator.getIndexByName(className);
                        const allocator = Allocator.get(allocatorIndex);

                        Object.defineProperty(Accessor.prototype, propertyName, {
                            enumerable: false,
                            configurable: false,
                            get: function() {
                                return allocator._accessInstance(self._intBuffer[this.__index * blockSize + propertyOffset]);
                            },
                            set: function(value) {
                                self._intBuffer[this.__index * blockSize + propertyOffset] = value.__index;
                            },
                        });

                        propertyOffset++;
                    } else {
                        Object.defineProperty(Accessor.prototype, propertyName, {
                            enumerable: false,
                            configurable: false,
                            get: function() {
                                return self._pointerList[this.__index * pointerCount + objectListIndex];
                            },
                            set: function(value) {
                                self._pointerList[this.__index * pointerCount + objectListIndex] = value;
                            },
                        });

                        objectListIndex++;
                    }
                } break;

                default:
                    console.error('Found an unknown allocator type. ', propertyType, className, propertyName);
                    break;
            }
        }

        return Accessor;
    }

    _constructElements(start, end) {
        for (let i = start; i < end - 1; i++) {
            this._intBuffer[i * this._blockSize] = i + 1;
        }
        this._intBuffer[(end - 1) * this._blockSize] = -1;

        for (let i = start; i < end; i++) {
            this._accessors[i] = new this._accessorClass();
            const accessor = this._accessors[i];
            accessor.__index = i;

            Object.freeze(accessor.__index);
        }

        if (this._constructor) {
            for (let i = start; i < end; i++) {
                this._constructor(this._accessors[i]);
            }
        }
    }

    static _getAllocationTypeCounts(type) {
        let pointer = 0;
        let value = 0;

        const properties = Object.getOwnPropertyNames(type);
        for (let i = 0; i < properties.length; i++) {
            const propertyName = properties[i];

            if (type[propertyName] === undefined || type[propertyName] === null) {
                pointer++;
            } else {
                const propertyType = typeof (type[propertyName]);
                const className = type[propertyName].constructor.name;
                switch (propertyType) {
                    case 'number':
                    case 'boolean':
                        value++;
                        break;

                    case 'string':
                        pointer++;
                        break;

                    case 'object':
                        if (Allocator.hasByName(className)) {
                            value++;
                        } else {
                            pointer++;
                        }
                        break;

                    default:
                        console.error('Found an unknown allocation type. ', propertyType, className, propertyName);
                }
            }
        }

        return [value, pointer];
    }

    static _getMethods(type) {
        const native = new Set([
            'constructor',
            '__defineGetter__',
            '__defineSetter__',
            'hasOwnProperty',
            '__lookupGetter__',
            '__lookupSetter__',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'toString',
            'valueOf',
            'toLocaleString']);

        let proto = type;
        const methodSet = new Set();
        do {
            const names = Object.getOwnPropertyNames(proto);
            for (let i = 0; i < names.length; i++) {
                if (typeof type[names[i]] !== 'function') {
                    continue;
                }
                if (native.has(names[i])) {
                    continue;
                }

                methodSet.add(names[i]);
            }
        } while (proto = Object.getPrototypeOf(proto));

        return Array.from(methodSet);
    }
}

class Allocator {
    static NULL = -1;
    static _ALLOCATORS = [];
    static _ALLOCATORS_BY_NAME = new Map();
    static _ALLOCATORS_INDICES_BY_NAME = new Map();

    static create(type, constructor, claimer, deconstructor, count) {
        const typeName = type.constructor.name;
        if (Allocator._ALLOCATORS_BY_NAME.has(typeName)) {
            return Allocator._ALLOCATORS_BY_NAME.get(typeName);
        }

        count = count || 512;

        const allocator = new Allocated(type, constructor, claimer, deconstructor, count);
        Allocator._ALLOCATORS.push(allocator);
        Allocator._ALLOCATORS_BY_NAME.set(typeName, allocator);
        Allocator._ALLOCATORS_INDICES_BY_NAME.set(typeName, Allocator._ALLOCATORS.length - 1);

        return allocator;
    }

    // you can't delete them yet because that would involve that index linked list thing that's complicated

    static has(index) {
        return index < Allocator._ALLOCATORS.length;
    }

    static hasByName(name) {
        return Allocator._ALLOCATORS_BY_NAME.has(name);
    }

    static get(index) {
        return Allocator._ALLOCATORS[index];
    }

    static getByName(name) {
        return Allocator._ALLOCATORS_BY_NAME.get(name);
    }

    static getIndexByName(name) {
        return Allocator._ALLOCATORS_INDICES_BY_NAME.get(name);
    }
}

if (typeof module !== 'undefined') {
    module.exports = Allocator;
}