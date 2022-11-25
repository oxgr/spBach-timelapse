#!/usr/bin/node

import { spawn } from 'child_process';
import path from 'path';

const ARGS = process.argv.slice( 2 );

if ( ARGS.length === 0 ) {
    // console.log( 'Please pass the interval in seconds as an argument!');
    // process.exit();
}

const opts = {
    interval: ARGS.length > 0 ? ARGS[ 0 ] : 30, // interval in seconds
    width: 1920,
    height: 1080,
}

if ( ARGS[ 0 ] === 'test' ) {
    console.log( 'Taking test image...' );
    captureImage( opts.width, opts.height, './test.jpg' );
    process.exit();
}

console.log( 'Starting timelapse with interval: %s seconds', opts.interval );
startTimelapse( opts );


async function startTimelapse( opts ) {

    const { interval, width, height } = opts;

    let remainingSeconds = interval;
    let count = 0;
    let cameraReady = true;

    return new Promise( resolve => {
        setInterval( async () => {

            const startHour = 8,	// inclusive
                endHour = 18;		// exclusive

            const date = new Date( Date.now() );
            const currentHour = date.getHours();
            const currentDay = date.getDay();

            if ( 
                currentHour < startHour || 
                currentHour >= endHour ||
                currentDay === 0 || 
                currentDay === 6 ) {
                process.stdout.write( `Timelapse paused. Current runtime is ${startHour}:00h-${endHour}:00h, Mon-Fri\r,` );
                return;
            }

            const outName = ( Date.now() * 0.001 ).toFixed( 0 );
            const outPath = `images/${outName}.jpg`;
            process.stdout.write( `Seconds until next capture: ${remainingSeconds--} \r` );                
            
            if ( remainingSeconds > 0 || !!!cameraReady ) {
                return;
            }

            remainingSeconds = interval;
            cameraReady = false;
            cameraReady = await captureImage( width, height, outPath );
            //if ( success ) 
            //console.log( `Img [${++count}]: ${outPath}`);
            //else 
            //    console.log('Error: Could not capture img [%d]. Retrying...', count);


        }, 1000 )
    } )


}


//captureImage( `images/${( Date.now() * 0.001 ).toFixed( 0 )}.jpg` );


async function captureImage( width, height, outputPath ) {
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
        if ( msg.includes( 'Error' ) ) {
            //console.log( msg ); 
            fswebcam.kill( 'SIGINT' );
            success = false;
        }
    } )
    //{ throw new Error( data.toString() ) } )

    fswebcam.on( 'error', ( a, b, c ) => { console.log( { a, b, c } ) } );

    return new Promise( resolve => {

        fswebcam.on( 'exit', async ( a, b, c ) => {
            //console.log({a,b,c});
            if ( success ) {
                console.log( `Img captured: ${path.basename( outputPath )} ` );
            } 
            // else {
            //     process.stdout.write( 'Error on capture. Retrying... \r' )
            //     setTimeout( async () => await captureImage( width, height, outputPath ), 1000 );    //  wait a second before retrying.
            // }
            resolve ( true );
        } );

    } )

}
