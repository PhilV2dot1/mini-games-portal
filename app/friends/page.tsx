'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { useFriends } from '@/hooks/useFriends';
import { FriendSearch } from '@/components/social/FriendSearch';
import { FriendRequestCard } from '@/components/social/FriendRequestCard';
import { FriendListItem } from '@/components/social/FriendListItem';
import { InviteToPlay } from '@/components/social/InviteToPlay';
import { pageEnter } from '@/lib/utils/motion';

export default function FriendsPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const {
    friends,
    pendingReceived,
    pendingSent,
    loading,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    searchUsers,
  } = useFriends();

  const [inviteTarget, setInviteTarget] = useState<{ userId: string; username: string } | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto">
        <Header />

        <motion.div {...pageEnter} className="space-y-6">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            {t('friends.title')}
          </h2>

          {!isAuthenticated ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {t('friends.loginRequired')}
              </p>
            </div>
          ) : (
            <>
              {/* Search */}
              <section>
                <FriendSearch
                  onSearch={searchUsers}
                  onSendRequest={sendRequest}
                />
              </section>

              {/* Pending Received */}
              {pendingReceived.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">
                    {t('friends.pending')} ({pendingReceived.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingReceived.map((friend) => (
                      <FriendRequestCard
                        key={friend.friendship_id}
                        friend={friend}
                        type="received"
                        onAccept={acceptRequest}
                        onDecline={declineRequest}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Pending Sent */}
              {pendingSent.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">
                    {t('friends.pendingSent')} ({pendingSent.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingSent.map((friend) => (
                      <FriendRequestCard
                        key={friend.friendship_id}
                        friend={friend}
                        type="sent"
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Friends List */}
              <section>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  {t('friends.myFriends')} ({friends.length})
                </h3>
                {loading && friends.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 dark:text-gray-500">{t('loading')}</p>
                  </div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {t('friends.noFriends')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {friends.map((friend) => (
                      <FriendListItem
                        key={friend.friendship_id}
                        friend={friend}
                        onRemove={removeFriend}
                        onInvite={() =>
                          setInviteTarget({
                            userId: friend.user_id,
                            username: friend.display_name || friend.username || 'Friend',
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </motion.div>

        {/* Invite Modal */}
        {inviteTarget && (
          <InviteToPlay
            isOpen={true}
            onClose={() => setInviteTarget(null)}
            friendUserId={inviteTarget.userId}
            friendUsername={inviteTarget.username}
          />
        )}
      </div>
    </div>
  );
}
