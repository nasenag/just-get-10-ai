/******************\
|  Just Get 10 AI  |
| @author Anthony  |
| @version 0.2     |
| @date 2015/01/01 |
| @edit 2015/01/01 |
\******************/

var JustGet10AI = (function() {
    /**********
     * config */
    var width = 5, height = 5;
    var newTileDelay = 350; //ms
    var numRandomMoves = 100;
    var computerMoveDelay = 20; //ms
    var lhRatio = 4;

    /*************
     * constants */
    var ENG_NUMS = [
        'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
        'eight', 'nine', 'ten', 'eleven', 'twelve'
    ];

    /*********************
     * working variables */
    var state;
    var maxSeen;

    /******************
     * work functions */
    function initJustGet10AI() {
        state = getRandomGrid(1, 3);
        maxSeen = 3;
        drawState();

        //add all the event listeners
        for (var hi = 0; hi < height; hi++) {
            for (var wi = 0; wi < width; wi++) {
                var id = hi*width+wi;
                $s('#'+id).addEventListener('click', (function(tileId) {
                    return function() {
                        mergeAt(tileId);
                    };
                })(id));
            }
        }

        //move randomly
        for (var ai = 0; ai < numRandomMoves; ai++) {
            setTimeout((function(id) {
                return function() {
                    mergeAt(id);
                };
            })(getRandInt(0, 25)), ai*computerMoveDelay);
        }
    }

    function mergeAt(id) { //returns false iff game is over
        var c = coordsFromId(id, state[0].length);
        var blobs = identBlobs(state);
        var blobToMerge = blobs[c[0]][c[1]];
        var blobValue = state[c[0]][c[1]];

        //get rid of all the numbers in this blob
        var numsRemoved = 0;
        for (var hi = 0; hi < height; hi++) {
            for (var wi = 0; wi < width; wi++) {
                if (blobToMerge === blobs[hi][wi]) {
                    state[hi][wi] = 0;
                    numsRemoved += 1;
                }
            }
        }

        //add the resulting tile
        if (numsRemoved > 1) {
            state[c[0]][c[1]] = blobValue+1;
            if (blobValue+1 > maxSeen) maxSeen = blobValue+1;
        } else { //need more than one tile to merge
            state[c[0]][c[1]] = blobValue;
            return;
        }

        //draw the version with the merged tile
        drawState();

        //gravity
        for (var hi = 0; hi < height; hi++) {
            for (var wi = 0; wi < width; wi++) {
                if (state[hi][wi] === 0) {
                    for (var ri = hi; ri >= 1; ri--) {
                        state[ri][wi] = state[ri-1][wi];
                        state[ri-1][wi] = 0;
                    }
                }
            }
        }

        //generate new tiles
        var maxNumToGen = Math.max(Math.min(6, maxSeen-2), 3); //[3, 6]
        for (var hi = 0; hi < height; hi++) {
            for (var wi = 0; wi < width; wi++) {
                if (state[hi][wi] === 0) {
                    state[hi][wi] = getWeightedIndex(
                        maxNumToGen+1, lhRatio, 1
                    );
                }
            }
        }

        //draw the tiles with the newly added ones
        setTimeout(drawState, newTileDelay);

        //check to see if the game is over
        var newBlobs = identBlobs(state);
        for (var hi = 0; hi < height; hi++) {
            for (var wi = 0; wi < width; wi++) {
                if (newBlobs[hi][wi] === width*height-1) { //max # blobs
                    setTimeout(function() {
                        alert('Game over.');
                        state = getRandomGrid(1, 3);
                        drawState();
                    }, 2*newTileDelay);
                    return false;
                }
            }
        }

        return true;
    }

    function identBlobs(st) {
        function checkNeighbors(s, b, id, visited) {
            visited.push(id);
            var c = coordsFromId(id, s[0].length);

            //check left
            if (c[1] > 0 && visited.indexOf(id-1) === -1) {
                //if this node has the same value as the one to its left
                if (s[c[0]][c[1]-1] === s[c[0]][c[1]]) {
                    //then their blob ids are equal
                    b[c[0]][c[1]-1] = b[c[0]][c[1]];
                    checkNeighbors(s, b, id-1, visited)
                }
            }
            //check right
            if (c[1] < st[0].length-1 && visited.indexOf(id+1) === -1) {
                if (s[c[0]][c[1]+1] === s[c[0]][c[1]]) {
                    b[c[0]][c[1]+1] = b[c[0]][c[1]];
                    checkNeighbors(s, b, id+1, visited)
                }
            }
            //check above
            if (c[0] > 0 && visited.indexOf(id-s[0].length) === -1) {
                if (s[c[0]-1][c[1]] === s[c[0]][c[1]]) {
                    b[c[0]-1][c[1]] = b[c[0]][c[1]];
                    checkNeighbors(s, b, id-s[0].length, visited)
                }
            }
            //check below
            if (c[0] < st.length-1 && visited.indexOf(id+s[0].length) === -1) {
                if (s[c[0]+1][c[1]] === s[c[0]][c[1]]) {
                    b[c[0]+1][c[1]] = b[c[0]][c[1]];
                    checkNeighbors(s, b, id+s[0].length, visited)
                }
            }
        }

        //init blob matrix to -1
        var ret = []; //matrix of blob ids, starting at 0
        for (var hi = 0; hi < height; hi++) {
            ret.push([]);
            for (var wi = 0; wi < width; wi++) {
                ret[hi].push(-1);
            }
        }

        //explore all blobs
        var currBlobId = 0;
        var seen = [];
        for (var ai = 0; ai < height*width; ai++) {
            if (seen.indexOf(ai) === -1) { //haven't seen before?
                var c = coordsFromId(ai, st[0].length);
                ret[c[0]][c[1]] = currBlobId;
                currBlobId += 1;
                checkNeighbors(st, ret, ai, seen);
            }
        }

        return ret;
    }

    function drawState() {
        for (var hi = 0; hi < height; hi++) {
            for (var wi = 0; wi < width; wi++) {
                var id = hi*width+wi;
                var tile = $s('#'+id);
                tile.className = 'tile ' + ENG_NUMS[state[hi][wi]];
                tile.innerHTML = state[hi][wi] === 0 ? '' : state[hi][wi];
            }
        }
    }

    function getRandomGrid(low, high) { //inclusive both ends
        var ret = [];
        for (var hi = 0; hi < height; hi++) {
            ret.push([]);
            for (var wi = 0; wi < width; wi++) {
                //low is lhRatio as likely
                var num = getWeightedIndex(high+1, lhRatio, low);
                ret[hi].push(num);
            }
        }
        return ret;
    }

    /***********
     * objects */

    /********************
     * helper functions */
    function logMatrix(mtx) {
        var colMaxLens = [];
        for (var ci = 0; ci < mtx[0].length; ci++) {
            var maxColValLen = 0;
            for (var ri = 0; ri < mtx.length; ri++) {
                var len = (''+mtx[ri][ci]).length;
                maxColValLen = Math.max(maxColValLen, len);
            }
            colMaxLens.push(maxColValLen);
        }
        for (var ri = 0; ri < mtx.length; ri++) {
            var row = '';
            for (var ci = 0; ci < mtx[0].length; ci++) {
                row += forceLen(mtx[ri][ci]+'', ' ', colMaxLens[ci], true)+' ';
            }
            console.log(row.substring(0, row.length-1));
        }
    }
    function coordsFromId(id, w) {
        return [Math.floor(id/w), id%w]; //row, col
    }
    function forceLen(str, padding, len, padFront) {
        if (str.length > len) return;
        var ret = str;
        for (var ai = 0; ai < len - str.length; ai++) {
            if (padFront) ret = padding+ret;
            else ret = ret+padding;
        }
        return ret;
    }
    function $s(id) { //for convenience
        if (id.charAt(0) !== '#') return false;
        return document.getElementById(id.substring(1));
    }
    function getRandInt(low, high) { //output is in [low, high)
        return Math.floor(low + Math.random()*(high-low));
    }
    /*
    Generates a weighted random number based on the area under r^-x in [0, 1)
    The parameter 'r' is the ratio of the probability of selecting the most likely number to the
    probability of selecting the least likely number. This was determined experimentally by
    looking at the distribution of numbers and finding patterns with MS Excel. 'r' correlates
    perfectly with the ratio of most likely : least likely. What a lucky coincidence!
    */
    function getWeightedIndex(high, r, low) {
        r = r || Math.E;
        low = low || 0;
        if (r === 1 || r <= 0) return getRandInt(low, high); //invalid parameter, return uniform random numbers
        var maxArea = (1 - Math.pow(r, -1))/Math.log(r); //area under r^-x in [0, 1)
        var goalArea = Math.random()*maxArea; //a random percent of that area
        var necessaryX = -Math.log(1 - goalArea*Math.log(r))/Math.log(r); //how far along the x axis you need to integrate to get the goal area
        return parseInt(Math.floor(low+(high-low)*necessaryX));
    }
    function round(n, places) {
        var mult = Math.pow(10, places);
        return Math.round(mult*n)/mult;
    }

    return {
        init: initJustGet10AI,
        mergeAt: mergeAt
    };
})();

window.addEventListener('load', function() {
    JustGet10AI.init();
});