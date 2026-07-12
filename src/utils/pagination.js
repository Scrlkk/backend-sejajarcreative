export const paginate = (query = {}) => {
  const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100);
  const offset = Math.max(Math.min(parseInt(query.offset) || 0, 10000000), 0);
  return { limit, offset };
};


