#!/usr/bin/node

import { spawn } from 'child_process';
import path from 'path';
import { clearLine } from 'readline';

const ARGS = process.argv.slice( 2 );

const OPTS = {

    // interval in seconds
    interval: ARGS.length > 0 ? ARGS[ 0 ] : 10,

    width: 1920,
    height: 1080,

    // inclusive. 8  === 8am
    firstHour: 8,

    // inclusive. 18 === 6pm
    lastHour: 18,

    // inclusive. 1  === Monday
    firstDay: 1,

    // inclusive. 5  === Friday
    lastDay: 5,
}

if ( ARGS[ 0 ] === 'test' ) {
    console.log( 'Taking test image...' );
    await captureImage( OPTS.width, OPTS.height, './test.jpg', { verbose: true } );
    process.exit();
}

console.log( 'Starting timelapse with interval: %s seconds', OPTS.interval );
startTimelapse( OPTS );


async function startTimelapse( OPTS ) {

    const {
        interval,
        width,
        height,
        firstHour,
        lastHour,
        firstDay,
        lastDay,
    } = OPTS;

    let remainingSeconds = interval;
    let cameraReady = true;

    // return new Promise( resolve => {
    //     setInterval( async () => {

    while ( true ) {
        const date = new Date( Date.now() );
        const currentHour = date.getHours();
        const currentDay = date.getDay();

        if ( currentHour < firstHour ||
            currentHour > lastHour ||
            currentDay < firstDay ||
            currentDay > lastDay ) {

            process.stdout.write( `Timelapse paused. Current runtime is ${firstHour}:00h-${lastHour}:00h, Mon-Fri\r` );
            return;

        }

        const outName = ( Date.now() * 0.001 ).toFixed( 0 );
        const outPath = `images/${outName}.jpg`;
        process.stdout.write( `Seconds until next capture: ${remainingSeconds--} \r` );

        if ( remainingSeconds === 0
            // && !!cameraReady
        ) {

            remainingSeconds = interval;
            cameraReady = false;
            cameraReady = await captureImage( width, height, outPath );

        }

        await sleep( 1000 )

    }
    // }, 1000 )
    // } )


}

async function captureImage( width, height, outputPath, { verbose = false } = {} ) {

    const fswebcam = spawn(
        'fswebcam', [
        '--no-banner',
        '--device', '/dev/video0',
        '-r', `${width}x${height}`,
        outputPath
    ] )

    let success = true;

    fswebcam.stdout.on( 'data', ( data ) => console.log( data.toString() ) )
    fswebcam.stderr.on( 'data', ( data ) => {
        const msg = data.toString();

        if ( !!verbose ) console.log( msg );

        if ( msg.includes( 'Error' ) ) {
            //console.log( msg ); 
            fswebcam.kill( 'SIGINT' );
            success = false;
        }
    } )

    fswebcam.on( 'error', ( a, b, c ) => { console.log( { a, b, c } ) } );

    return new Promise( resolve => {

        fswebcam.on( 'exit', async () => {
            clearLine( process.stdout )
            if ( success ) {
                console.log( `Img captured: ${path.basename( outputPath )} ` );
            } else {
                console.log( 'Error on capture.' )

                //     process.stdout.write( 'Error on capture. Retrying... \r' )
                //     setTimeout( async () => await captureImage( width, height, outputPath ), 1000 );    //  wait a second before retrying.

            }
            resolve( true );
        } );

    } )

}

async function sleep( ms = 1000 ) {
    return new Promise( ( r ) => setTimeout( r, ms ) );
}
