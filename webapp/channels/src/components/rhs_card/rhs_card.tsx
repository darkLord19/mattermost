// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import deepEqual from 'fast-deep-equal';
import React from 'react';
import type {ReactNode} from 'react';
import Scrollbars from 'react-custom-scrollbars';
import {FormattedMessage} from 'react-intl';
import {Link} from 'react-router-dom';

import type {Post} from '@mattermost/types/posts';

import {emitCloseRightHandSide} from 'actions/global_actions';

import Markdown from 'components/markdown';
import PostProfilePicture from 'components/post_profile_picture';
import RhsCardHeader from 'components/rhs_card_header';
import UserProfile from 'components/user_profile';

import Constants from 'utils/constants';
import DelayedAction from 'utils/delayed_action';

import type {PostPluginComponent} from 'types/store/plugins';
import type {RhsState} from 'types/store/rhs';

type Props = {
    isMobileView: boolean;
    selected?: Post;
    pluginPostCardTypes?: Record<string, PostPluginComponent>;
    previousRhsState?: RhsState;
    enablePostUsernameOverride?: boolean;
    teamUrl?: string;
};

type State = {
    isScrolling: boolean;
};

export function renderView(props: Props) {
    return (
        <div
            {...props}
            className='scrollbar--view'
        />
    );
}

export function renderThumbHorizontal(props: Props) {
    return (
        <div
            {...props}
            className='scrollbar--horizontal'
        />
    );
}

export function renderThumbVertical(props: Props) {
    return (
        <div
            {...props}
            className='scrollbar--vertical'
        />
    );
}

export default class RhsCard extends React.Component<Props, State> {
    scrollStopAction: DelayedAction;

    static defaultProps = {
        pluginPostCardTypes: {},
    };

    constructor(props: Props) {
        super(props);

        this.scrollStopAction = new DelayedAction(this.handleScrollStop);

        this.state = {
            isScrolling: false,
        };
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        if (!deepEqual(nextProps.selected?.props?.card, this.props.selected?.props?.card)) {
            return true;
        }
        if (nextState.isScrolling !== this.state.isScrolling) {
            return true;
        }
        return false;
    }

    handleScroll = () => {
        if (!this.state.isScrolling) {
            this.setState({
                isScrolling: true,
            });
        }

        this.scrollStopAction.fireAfter(Constants.SCROLL_DELAY);
    };

    handleScrollStop = () => {
        this.setState({
            isScrolling: false,
        });
    };

    handleClick = () => {
        if (this.props.isMobileView) {
            emitCloseRightHandSide();
        }
    };

    render() {
        if (this.props.selected == null) {
            return (<div/>);
        }

        const {selected, pluginPostCardTypes, teamUrl} = this.props;
        const postType = selected.type;
        let content: ReactNode = null;
        if (pluginPostCardTypes?.hasOwnProperty(postType)) {
            const PluginComponent = pluginPostCardTypes[postType].component;
            content = <PluginComponent post={selected}/>;
        }

        if (!content) {
            content = (
                <div className='info-card'>
                    <Markdown message={(selected.props && selected.props.card) || ''}/>
                </div>
            );
        }

        let user = (
            <UserProfile
                userId={selected.user_id}
                hideStatus={true}
                disablePopover={true}
            />
        );
        if (selected.props.override_username && this.props.enablePostUsernameOverride) {
            user = (
                <UserProfile
                    userId={selected.user_id}
                    hideStatus={true}
                    disablePopover={true}
                    overwriteName={selected.props.override_username}
                />
            );
        }
        const avatar = (
            <PostProfilePicture
                compactDisplay={false}
                post={selected}
                userId={selected.user_id}
            />
        );

        return (
            <div className='sidebar-right__body sidebar-right__card'>
                <RhsCardHeader previousRhsState={this.props.previousRhsState}/>
                <Scrollbars
                    autoHide={true}
                    autoHideTimeout={500}
                    autoHideDuration={500}
                    renderThumbHorizontal={renderThumbHorizontal}
                    renderThumbVertical={renderThumbVertical}
                    renderView={renderView}
                    onScroll={this.handleScroll}
                >
                    <div className='post-right__scroll'>
                        {content}
                        <div className='d-flex post-card--info'>
                            <div className='post-card--post-by overflow--ellipsis'>
                                <FormattedMessage
                                    id='rhs_card.message_by'
                                    defaultMessage='Message by {avatar} {user}'
                                    values={{user, avatar}}
                                />
                            </div>
                            <div className='post-card--view-post'>
                                <Link
                                    to={`${teamUrl}/pl/${selected.id}`}
                                    className='post__permalink'
                                    onClick={this.handleClick}
                                >
                                    <FormattedMessage
                                        id='rhs_card.jump'
                                        defaultMessage='Jump'
                                    />
                                </Link>
                            </div>
                        </div>
                    </div>
                </Scrollbars>
            </div>
        );
    }
}
