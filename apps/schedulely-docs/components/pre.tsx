import { Highlight, themes } from 'prism-react-renderer';
import { Schedulely } from 'schedulely';
import { generateEvents } from './helpers.stories';
import React, {
  PropsWithChildren,
  isValidElement,
  useEffect,
  useState,
} from 'react';
import ReactDOMServer from 'react-dom/server';
import he from 'he';

type ClientSideLiveReloadElements = {
  liveProvider: any;
  livePreview: any;
  liveEditor: any;
  liveError: any;
};

export const LivePre = (props: PropsWithChildren) => {
  const children = props.children as JSX.Element;
  const options = children.props.className.split(',');
  const language = options[0].replace(/language-/, '');
  const live = !!options[1];
  const code = he.decode(
    ReactDOMServer.renderToString(children.props.children)
  );

  const [reactLiveComponents, setReactLiveComponents] = useState<
    ClientSideLiveReloadElements | undefined
  >();

  useEffect(() => {
    console.log('useeffect');
    import('react-live').then((x) => {
      console.log('imported stuff');
      setReactLiveComponents({
        liveEditor: x.LiveEditor,
        livePreview: x.LivePreview,
        liveProvider: x.LiveProvider,
        liveError: x.LiveError,
      });
    });
  }, []);

  if (
    live &&
    reactLiveComponents &&
    isValidElement(props.children) &&
    children.type.name === 'Code'
  ) {
    return (
      <reactLiveComponents.liveProvider
        code={code}
        language={language}
        scope={{ React, generateEvents, Schedulely }} // <-- inject objects you need access to
        noInline={true}
        theme={themes.vsDark}
      >
        <reactLiveComponents.livePreview />
        <reactLiveComponents.liveError />
        <reactLiveComponents.liveEditor
          code={code}
          language={language}
          style={{ borderRadius: '0.5em', overflow: 'hidden' }}
        />
      </reactLiveComponents.liveProvider>
    );
  }

  return (
    <Highlight theme={themes.vsDark} code={code} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre style={{ ...style, borderRadius: '0.5em' }}>
          {tokens.map((line, i) => {
            if (line[0].empty) return;
            return (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
};
