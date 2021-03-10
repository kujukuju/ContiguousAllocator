### Contiguous Allocator

---

One of the biggest problems javascript has is everything is a pointer, and garbage collection/allocation/pointers are all very slow in javascript, so this thing reflects back on the class instance you provide it, deletes the object, and reconstructs its memory all in a contiguous TypedArray, which is a low level data type in JS that's actually allocated as contiguous memory.

So this thing forces your objects to be instanced, using chromium/cpp memory, and all contiguous, no pointers.

Then it provides back a really cheap accessor object that has baked in property accessors that force access through the literal memory of this low level array object.

The result being that from your perspective nothing has changed, but the memory is now all cheaply allocated and theoretically fewer cache misses.

---

    NOTE: The main benefit this gives you right now is that there is no memory allocation,
    and the stored types are 32 bit, not the native javascript 64. This should prevent
    nearly all garbage collection related frame drops in games. It doesn't seem to be really
    any faster, and often it's slightly slower, because it has extra work to do to access
    the values.