/******************\
|  Just Get 10 AI  |
| @author Anthony  |
| @version 0.1     |
| @date 2015/01/01 |
| @edit 2015/01/01 |
\******************/

var JustGet10AI = (function() {
    /**********
     * config */
    var width = 5;
    var height = 5;

    /*************
     * constants */
    var ENG_NUMS = [
        'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
        'eight', 'nine', 'ten', 'eleven', 'twelve'
    ];

    /*********************
     * working variables */
    var state;

    /******************
     * work functions */
    function initJustGet10AI() {
        randomlyInitTiles();
        logMatrix(identBlobs(state));
    }

    function identBlobs(st) {
        function coordsFromId(id) {
            return [Math.floor(id/st[0].length), id%st[0].length]; //row, col
        }
        function checkNeighbors(s, b, id, visited) {
            visited.push(id);
            var c = coordsFromId(id);

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
                var c = coordsFromId(ai);
                ret[c[0]][c[1]] = currBlobId;
                currBlobId += 1;
                checkNeighbors(st, ret, ai, seen);
            }
        }

        return ret;
    }

    function randomlyInitTiles() {
        state = getRandomGrid(1, 3);
        for (var hi = 0; hi < height; hi++) {
            for (var wi = 0; wi < width; wi++) {
                //in [1, 4), 1 is 2x as likely as 4
                var tile = document.getElementById(hi+'-'+wi);
                tile.className = 'tile ' + ENG_NUMS[state[hi][wi]];
                tile.innerHTML = state[hi][wi];
            }
        }
    }

    function getRandomGrid(low, high) { //inclusive both ends
        var ret = [];
        for (var hi = 0; hi < height; hi++) {
            ret.push([]);
            for (var wi = 0; wi < width; wi++) {
                ret[hi].push(
                    getWeightedIndex(high+1, 2, low) //low is 2x as likely
                );
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
        identBlobs: identBlobs
    }
})();

window.addEventListener('load', function() {
    JustGet10AI.init();
});