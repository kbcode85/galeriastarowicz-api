export default () => {
  return async (ctx, next) => {
    console.log('Auth header:', ctx.request.header.authorization);
    console.log('User:', ctx.state.user);
    await next();
  };
}; 