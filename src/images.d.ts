declare module '*.webp' {
    const src: string;
    export default src;
}
declare module '*.png' {
    const src: string;
    export default src;
}
declare module '*.jpg' {
    const src: string;
    export default src;
}
declare module '*.jpeg' {
    const src: string;
    export default src;
}
declare module '*.svg' {
    const ReactComponent: any;
    const content: string;
    export { ReactComponent };
    export default content;
}
