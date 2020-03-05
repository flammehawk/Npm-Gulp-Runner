import ErrnoException = NodeJS.ErrnoException;

export module Helper {

    export function myCallBack(errnoException: ErrnoException, done):void {
        if (errnoException) {
            console.error(errnoException);
            done(errnoException.message);
        } else {
            done();
        }
    }
}