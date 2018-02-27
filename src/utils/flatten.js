module.exports = (inputArray = []) => {
    return (inputArray || []).reduce((result = [], current = []) => {
        const hasMore = [].concat(current).some(Array.isArray);
        return result.concat(hasMore ? flatten(current) : current);
    }, []);
};
