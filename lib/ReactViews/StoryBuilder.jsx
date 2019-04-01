import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {getShareData } from './Map/Panels/SharePanel/BuildShareLink';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from './ObserveModelMixin';
import Icon from "./Icon.jsx";
import Story from './Story.jsx';
import StoryEditor from './StoryEditor.jsx';
import uniqid from 'uniqid';

import Styles from './story-builder.scss';

const StoryBuilder = createReactClass({
    displayName: 'StoryBuilder',
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            editingMode: false,
            currentStory: undefined
        };
    },

    removeStory(story) {
        this.props.terria.stories = this.props.terria.stories.filter(st => st.id !== story.id);
    },
    onSave(_story) {
      const story = {
        title: _story.title,
        text: _story.text,
        id: _story.id ? _story.id : uniqid(),
      };

      !defined(_story.id) && this.captureStory(story);

      const storyIndex = (this.props.terria.stories || []).map(story => story.id).indexOf(_story.id);
    
      if(storyIndex >= 0) {
        // replace the old story
        this.props.terria.stories = [...this.props.terria.stories.slice(0, storyIndex), story, ...this.props.terria.stories.slice(storyIndex + 1)];
      } else {
        this.props.terria.stories = [...(this.props.terria.stories || []), story];
      }

      this.setState({
          editingMode: false
      });
  },

    captureStory(story) {
        story.shareData = JSON.parse(JSON.stringify(getShareData(this.props.terria, false)));
    },

    runStories() {
        this.props.viewState.storyBuilderShown = false;
        this.props.viewState.storyShown = true;
        this.props.terria.currentViewer.notifyRepaintRequired();
    },

    editStory(story) {
          this.props.viewState.storyBuilderShow = true;
          this.props.viewState.storyShown = false;
          this.setState({
            editingMode: true,
            currentStory: story
          });
    },

   viewStory(story) {
       this.props.terria.nowViewing.removeAll();
       if (story.shareData) {
            this.props.terria.updateFromStartData(story.shareData);
        }       
       this.runStories();
   },
    
     renderIntro() {
      return (<div className={Styles.intro}><Icon glyph={Icon.GLYPHS.story}/> <strong>This is your story editor</strong><div className={Styles.instructions}>
       <p>1. Capture scenes from your map</p><p>2. Add text and images</p><p>3. Share with others</p></div></div>);
    },

    renderStories() {
      return <div className={Styles.stories}>{this.props.terria.stories.map(story=><Story key={story.id} story={story} deleteStory={this.removeStory} recaptureStory={this.captureStory} viewStory={this.viewStory} editStory={this.editStory}/>)}</div>; 
      },

    onClickCapture() {
      this.setState({
        editingMode: true,
        currentStory: undefined
      });
    },

    render() {
        const hasStories = defined(this.props.terria.stories) && this.props.terria.stories.length > 0;
        return (
            <div className={Styles.storyPanel}>
                <div className={Styles.header}>
                  {!hasStories && this.renderIntro()}
                  <div className={Styles.actions}>
                   {hasStories && <button disabled ={this.state.editingMode || !hasStories} className={Styles.previewBtn} onClick={this.runStories} title="preview stories"><Icon glyph={Icon.GLYPHS.play}/>Play Story</button>}
                   <button disabled={this.state.editingMode} className={Styles.captureBtn} title='capture current scene' onClick={this.onClickCapture}> <Icon glyph={Icon.GLYPHS.story}/> Capture Scene </button>
                  </div>
                </div>
               {!this.state.editingMode && hasStories &&  this.renderStories()}
               {this.state.editingMode && <StoryEditor removeStory={this.removeStory} exitEditingMode={()=>this.setState({editingMode: false})} story={this.state.currentStory} saveStory ={this.onSave}/>}
            </div>
        );
    }
});

export default StoryBuilder;