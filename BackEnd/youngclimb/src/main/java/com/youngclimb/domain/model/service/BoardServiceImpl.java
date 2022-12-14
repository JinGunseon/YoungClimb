package com.youngclimb.domain.model.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.youngclimb.domain.model.dto.board.*;
import com.youngclimb.domain.model.dto.member.MemberDto;
import com.youngclimb.domain.model.entity.*;
import com.youngclimb.domain.model.repository.*;
import com.youngclimb.domain.model.util.BoardDtoCreator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class BoardServiceImpl implements BoardService {

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    @Value("${cloud.aws.cloudfront.domain}")
    private String domain;

    private final MemberRepository memberRepository;
    private final BoardRepository boardRepository;
    private final BoardMediaRepository boardMediaRepository;
    private final BoardLikeRepository boardLikeRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final BoardScrapRepository boardScrapRepository;
    private final CommentRepository commentRepository;
    private final CategoryRepository categoryRepository;
    private final CenterRepository centerRepository;
    private final WallRepository wallRepository;
    private final CenterLevelRepository centerLevelRepository;
    private final FollowRepository followRepository;
    private final MemberRankExpRepository memberRankExpRepository;
    private final ReportRepository reportRepository;
    private final MemberProblemRepository memberProblemRepository;
    private final RankRepository rankRepository;
    private final NoticeRepository noticeRepository;
    private final AmazonS3 amazonS3;
    private final BoardDtoCreator boardDtoCreator;


    // 2??? ?????? ????????? ????????? ??????
    @Override
    public MainPageDto readRecentBoard(String email, Pageable pageable) {
        // ?????? Dto List
        List<BoardDto> boardDtos = new ArrayList<>();
        MainPageDto mainPageDto = new MainPageDto();

        Member member = memberRepository.findByEmail(email).orElseThrow();
        Slice<Board> recentBoards = boardRepository.findAllByCreatedDateTimeAfterOrderByCreatedDateTimeDesc(LocalDateTime.now().minusWeeks(2), pageable);

        // 2??? ?????? ?????????
        for (Board board : recentBoards) {
            if (board.getIsDelete() != 0) continue;
            if (reportRepository.existsByBoardAndMember(board, member)) continue;

            // ????????? ?????? ?????? ??????
            if (!followRepository.existsByFollowerAndFollowing(member, board.getMember())) continue;

            // ????????? Dto ??????
            BoardDto boardDto = boardDtoCreator.startDto(board, member);
            boardDto.setCreateUser(boardDtoCreator.toCreateUser(board, member));

            // ?????? DTO 1??? ??????
            List<Comment> comments = commentRepository.findAllByBoard(board, Sort.by(Sort.Direction.DESC, "createdDateTime"));
            if (!comments.isEmpty()) {
                for (Comment comment : comments) {
                    if (comment.getParentId() == 0) {
                        CommentPreviewDto commentPreviewDto = CommentPreviewDto.builder().nickname(comment.getMember().getNickname()).comment(comment.getContent()).build();
                        boardDto.setCommentPreview(commentPreviewDto);
                        break;
                    }
                }
            }

            // List add
            boardDtos.add(boardDto);

        }

        mainPageDto.setBoardDtos(boardDtos);
        mainPageDto.setNextPage(recentBoards.hasNext());

        return mainPageDto;
    }

    // ??????????????? ?????? ?????????
    @Override
    public MainPageDto readAddBoard(String email, Pageable pageable) {
        // ?????? Dto List
        List<BoardDto> boardDtos = new ArrayList<>();
        MainPageDto mainPageDto = new MainPageDto();

        Member member = memberRepository.findByEmail(email).orElseThrow();

        List<Follow> followList = followRepository.findAllByFollower(member);
        List<Member> followMembers = new ArrayList<>();
        followMembers.add(member);

        if (!followList.isEmpty()) {
            for (Follow follow : followList) {
                followMembers.add(memberRepository.findById(follow.getFollowing().getMemberId()).get());
            }
        }

        Slice<Board> recentBoards = boardRepository.findAllByCreatedDateTimeAfterAndMemberNotInOrderByCreatedDateTimeDesc(LocalDateTime.now().minusWeeks(2), followMembers, pageable);

        // 2??? ?????? ?????????
        for (Board board : recentBoards) {
            // ????????? ?????????
            if (board.getIsDelete() != 0) continue;
            // ????????? ????????? ?????????
            if (reportRepository.existsByBoardAndMember(board, member)) continue;

            // ????????? Dto ??????
            BoardDto boardDto = boardDtoCreator.startDto(board, member);
            boardDto.setCreateUser(boardDtoCreator.toCreateUser(board, member));


            // ?????? DTO 1??? ??????
            List<Comment> comments = commentRepository.findAllByBoard(board, Sort.by(Sort.Direction.DESC, "createdDateTime"));
            if (!comments.isEmpty()) {
                for (Comment comment : comments) {
                    if (comment.getParentId() == 0) {
                        CommentPreviewDto commentPreviewDto = CommentPreviewDto.builder().nickname(comment.getMember().getNickname()).comment(comment.getContent()).build();
                        boardDto.setCommentPreview(commentPreviewDto);
                        break;
                    }
                }
            }

            // List add
            boardDtos.add(boardDto);

        }

        mainPageDto.setBoardDtos(boardDtos);
        mainPageDto.setNextPage(recentBoards.hasNext());

        return mainPageDto;
    }

    // ????????? ????????? ??????
    public Long updateView(Long boardId) {
        Board board = boardRepository.findById(boardId).orElseThrow();
        boardRepository.save(board.addView());
        return board.getBoardView();
    }

    // ????????? ??????
    @Override
    public BoardMediaDto saveImage(MultipartFile file) throws InterruptedException {
        if (file != null) {
            String fileName = createFileName(file.getOriginalFilename());
            try (InputStream inputStream = file.getInputStream()) {
                ObjectMetadata objectMetadata = new ObjectMetadata();
                objectMetadata.setContentLength(file.getSize());
                objectMetadata.setContentType(file.getContentType());
                amazonS3.putObject(new PutObjectRequest(bucket + "/boardImg", fileName, inputStream, objectMetadata).withCannedAcl(CannedAccessControlList.PublicRead));

            } catch (IOException e) {
                e.printStackTrace();
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "?????? ???????????? ??????????????????.");
            }
            BoardMediaDto boardMediaDto = new BoardMediaDto();
//            boardMediaDto.setMediaPath(amazonS3.getUrl(bucket + "/boardImg", fileName).toString());
            boardMediaDto.setMediaPath(domain + fileName);
            Thread.sleep(5200);
            boardMediaDto.setThumbnailPath(amazonS3.getUrl(bucket + "/boardThumb", getFileExtension(fileName).concat(".png")).toString());

            return boardMediaDto;
        } else {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "????????? ????????????.");
        }

    }

    private String createFileName(String fileName) {
//        return UUID.randomUUID().toString().concat(getFileExtension(fileName));
        return UUID.randomUUID().toString().concat(fileName);
    }

    private String getFileExtension(String fileName) {
        try {
            return fileName.substring(0, fileName.indexOf("."));
        } catch (StringIndexOutOfBoundsException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "????????? ????????? ???????????????");
        }
    }

    // ????????? ??????
    @Override
    public void writeBoard(String email, BoardCreate boardCreate) {

        // ????????? ????????????
        Board board = boardCreate.toBoard();
        Member member = memberRepository.findByEmail(email).orElseThrow();
        board.setMember(member);
        boardRepository.save(board);

        // ???????????? ????????????
        Category category = Category.builder()
                .board(board)
                .center(centerRepository.findById(boardCreate.getCenterId()).orElseThrow())
                .wall(wallRepository.findById(boardCreate.getWallId()).orElse(null))
                .centerlevel(centerLevelRepository.findById(boardCreate.getCenterLevelId()).orElseThrow())
                .holdcolor(boardCreate.getHoldColor())
                .difficulty(centerLevelRepository.findById(boardCreate.getCenterLevelId()).orElseThrow().getLevel().getRank())
                .build();
        categoryRepository.save(category);

        // ????????? ????????? ??????
        BoardMedia boardMedia = BoardMedia.builder()
                .board(board)
                .mediaPath(boardCreate.getMediaPath())
                .thumbnailPath(boardCreate.getThumbnailPath())
                .build();
        boardMediaRepository.save(boardMedia);

        // ?????? ????????? ?????? ????????????
        // ??????????????? ?????? ????????????
        Level level = category.getCenterlevel().getLevel();

        // ?????? ????????? ????????????
        MemberRankExp memberExp = memberRankExpRepository.findByMember(member).orElseThrow();
        memberExp.addMemberExp(level.getExp());

        // ?????? ??? ?????? ????????????
        MemberProblem memberProblem = memberProblemRepository.findByMember(member).orElseThrow();
        memberProblem.addProblem(level.getRank());
        memberProblemRepository.save(memberProblem);

        // ?????? ????????????
        List<Rank> ranks = rankRepository.findAll();
        ranks.sort((o1, o2) -> (int) (o2.getQual() - o1.getQual()));



        for(int i = 1; i<ranks.size(); i++) {
            if ((memberProblem.findSolvedProblem(ranks.get(i).getProblem()) >= 3) && (ranks.get(i).getQual() <= memberExp.getMemberExp())) {
                memberExp.setRank(ranks.get(i-1));
                break;
            }
        }

        memberRankExpRepository.save(memberExp);
    }

    // ????????? ????????????
    @Override
    public void updateBoard(String email, BoardEdit boardEdit, Long boardId) {
        Member member = memberRepository.findByEmail(email).orElseThrow();
        Board board = boardRepository.findById(boardId).orElseThrow();

        if (board.getMember().equals(member)) {
            board.updateContent(boardEdit.getContent());
            boardRepository.save(board);
        }
    }

    // ????????? ????????????
    @Override
    public void deleteBoard(String email, Long boardId) {
        Board board = boardRepository.findById(boardId).orElseThrow();
        Member member = board.getMember();
        Category category = categoryRepository.findByBoard(board).orElseThrow();

        // ????????? ??????
        if (board.getMember().getEmail().equals(email)) {
            board.setIsDelete(1);
            boardRepository.save(board);

            // ?????? ????????? ?????? ????????????
            // ??????????????? ?????? ????????????
            Level level = category.getCenterlevel().getLevel();

            // ?????? ????????? ????????????
            MemberRankExp memberExp = memberRankExpRepository.findByMember(member).orElseThrow();
            memberExp.reduceMemberExp(level.getExp());

            // ?????? ??? ?????? ????????????
            MemberProblem memberProblem = memberProblemRepository.findByMember(member).orElseThrow();
            memberProblem.reduceProblem(level.getRank());
            memberProblemRepository.save(memberProblem);

            // ?????? ????????????
            List<Rank> ranks = rankRepository.findAll();
            ranks.sort((o1, o2) -> (int) (o2.getQual() - o1.getQual()));

            for(int i = 1; i<ranks.size(); i++) {
                if ((memberProblem.findSolvedProblem(ranks.get(i).getProblem()) >= 3) && (ranks.get(i).getQual() <= memberExp.getMemberExp())) {
                    memberExp.setRank(ranks.get(i-1));
                    break;
                }
            }
            memberRankExpRepository.save(memberExp);
        }

    }

    // ????????? ?????????
    @Override
    public BoardLikeDto boardLikeCancle(Long boardId, String email) {
        Board board = boardRepository.findById(boardId).orElseThrow();
        Member member = memberRepository.findByEmail(email).orElseThrow();
        BoardLikeDto boardLikeDto = new BoardLikeDto();

        boolean isLike = boardLikeRepository.existsByBoardAndMember(board, member);

        // ????????? ????????? ????????? ?????? ??????
        if (!isLike) {
            BoardLike boardLike = BoardLike.builder().board(board).member(member).build();
            boardLikeRepository.save(boardLike);

            if (board.getMember() != member) {
                Notice noticeBuild = Notice.builder()
                        .type(2)
                        .toMember(board.getMember())
                        .fromMember(member)
                        .board(board)
                        .comment(null)
                        .createdDateTime(LocalDateTime.now())
                        .build();
                noticeRepository.save(noticeBuild);

                // ?????? ?????? ?????????
                try {
                    if (board.getMember().getFcmToken() != null) {
                        Notification notification = new Notification("", member.getNickname() + "?????? ???????????? ???????????????.");

                        Message message = Message.builder()
                                .setNotification(notification)
                                .setToken(board.getMember().getFcmToken())
                                .build();

                        FirebaseMessaging.getInstance().send(message);
                    }
                } catch (Exception e) {
                    board.getMember().setFcmToken(null);
                    memberRepository.save(board.getMember());
                }
            }

            boardLikeDto.setIsLike(Boolean.TRUE);
            boardLikeDto.setLike(boardLikeRepository.countByBoard(board));

            return boardLikeDto;
        }
        // ????????? ????????? ????????? ??????
        else {
            if (board.getMember() != member) {
                Notice notice = noticeRepository.findByBoardAndFromMemberAndType(board, member, 2).orElse(null);
                noticeRepository.delete(notice);
            }
            boardLikeRepository.deleteByBoardAndMember(board, member);
//            List<BoardLike> boardLikes = boardLikeRepository.findAllByBoard(board);
            boardLikeDto.setIsLike(Boolean.FALSE);
            boardLikeDto.setLike(boardLikeRepository.countByBoard(board));

            return boardLikeDto;
        }


    }

    // ????????? - ?????? ????????????
    @Override
    public BoardDetailDto readAllComments(Long boardId, String email) {
        BoardDetailDto boardDetailDto = new BoardDetailDto();
        Member member = memberRepository.findByEmail(email).orElseThrow();

        // ????????? DTO ??????
        Board board = boardRepository.findById(boardId).orElseThrow();

        BoardDto boardDto = boardDtoCreator.startDto(board, member);
        boardDto.setCreateUser(boardDtoCreator.toCreateUser(board, member));

        boardDetailDto.setBoardDto(boardDto);

        // ?????? DTO ??????
        List<Comment> comments = commentRepository.findAllByBoard(board, Sort.by(Sort.Direction.DESC, "createdDateTime"));
        List<CommentDto> commentDtos = new ArrayList<>();
        for (Comment comment : comments) {
            if (comment.getParentId() == 0) {
                CommentDto commentDto = boardDtoCreator.toCommentDtos(comment, member);

                // ????????? ??????
                List<Comment> reComments = commentRepository.findByParentId(comment.getId(), Sort.by(Sort.Direction.ASC, "createdDateTime"));
                List<CommentDto> reCommentDtos = new ArrayList<>();
                for (Comment reComment : reComments) {
                    CommentDto reCommentDto = boardDtoCreator.toCommentDtos(reComment, member);
                    reCommentDtos.add(reCommentDto);
                }

                commentDto.setCommentLikeNum(commentLikeRepository.countByComment(comment));

                commentDto.setReComment(reCommentDtos);
                commentDtos.add(commentDto);
            }
        }
        boardDetailDto.setCommentDtos(commentDtos);

        return boardDetailDto;
    }

    // ?????? ?????????
    @Override
    public Boolean commentLikeCancle(Long commentId, String email) {
        Comment comment = commentRepository.findById(commentId).orElseThrow();
        Member member = memberRepository.findByEmail(email).orElseThrow();
        boolean isLike = commentLikeRepository.existsByCommentAndMember(comment, member);

        if (!isLike) {
            CommentLike commentLike = CommentLike.builder().comment(comment).member(member).build();
            commentLikeRepository.save(commentLike);

            if (comment.getMember() != member) {
                Notice noticeBuild = Notice.builder()
                        .type(4)
                        .toMember(comment.getMember())
                        .fromMember(member)
                        .board(null)
                        .createdDateTime(LocalDateTime.now())
                        .comment(comment)
                        .build();
                noticeRepository.save(noticeBuild);

                // ?????? ?????? ?????????
                try {
                    if (comment.getMember().getFcmToken() != null) {
                        Notification notification = new Notification("", member.getNickname() + "?????? ????????? ???????????????.");

                        Message message = Message.builder()
                                .setNotification(notification)
                                .setToken(comment.getMember().getFcmToken())
                                .build();

                        FirebaseMessaging.getInstance().send(message);
                    }
                } catch (Exception e) {
                    comment.getMember().setFcmToken(null);
                    memberRepository.save(comment.getMember());
                }
            }


            return true;
        } else {
            if (comment.getMember() != member) {
                Notice notice = noticeRepository.findByCommentAndFromMemberAndType(comment, member, 4).orElse(null);
                noticeRepository.delete(notice);
            }

            commentLikeRepository.deleteByCommentAndMember(comment, member);
            return false;
        }

    }

    // ?????? ??????
    @Override
    public void writeComment(CommentCreate commentCreate, Long boardId, String email) {

        // ?????? ????????????
        Comment comment = commentCreate.toComment();
        Board board = boardRepository.findById(boardId).orElseThrow();
        Member member = memberRepository.findByEmail(email).orElseThrow();

        comment.setMemberandBoard(member, board);
        commentRepository.save(comment);

        // ?????? ????????????
        if (board.getMember() != member) {
            Notice noticeBuild = Notice.builder()
                    .type(3)
                    .toMember(board.getMember())
                    .fromMember(member)
                    .board(board)
                    .comment(null)
                    .createdDateTime(LocalDateTime.now())
                    .build();
            noticeRepository.save(noticeBuild);

            // ?????? ?????? ?????????
            try {
                if (board.getMember().getFcmToken() != null) {
                    Notification notification = new Notification("", member.getNickname() + "?????? ???????????? ????????? ?????????????????????.");

                    Message message = Message.builder().setNotification(notification).setToken(board.getMember().getFcmToken()).build();

                    FirebaseMessaging.getInstance().send(message);
                }
            } catch (Exception e) {
                board.getMember().setFcmToken(null);
                memberRepository.save(board.getMember());
            }
        }
    }

    // ????????? ??????
    @Override
    public void writeRecomment(CommentCreate commentCreate, Long boardId, Long commentId, String email) {

        Comment comment = commentCreate.toComment();
        Board board = boardRepository.findById(boardId).orElseThrow();
        Member member = memberRepository.findByEmail(email).orElseThrow();

        comment.setMemberandBoard(member, board);
        comment.setParentId(commentId);
        commentRepository.save(comment);

        // ?????? ????????????
        if (comment.getMember() != member) {
            Notice noticeBuild = Notice.builder()
                    .type(5)
                    .toMember(comment.getMember())
                    .fromMember(member)
                    .board(board)
                    .comment(null)
                    .createdDateTime(LocalDateTime.now()).build();

            noticeRepository.save(noticeBuild);

            // ?????? ?????? ?????????
            try {
                if (comment.getMember().getFcmToken() != null) {
                    Notification notification = new Notification("", member.getNickname() + "?????? ???????????? ?????????????????????.");

                    Message message = Message.builder().setNotification(notification).setToken(comment.getMember().getFcmToken()).build();

                    FirebaseMessaging.getInstance().send(message);
                }
            } catch (Exception e) {
                comment.getMember().setFcmToken(null);
                memberRepository.save(comment.getMember());
            }
        }
    }

    // ?????? ??????
    @Override
    public void deleteComment(Long commentId, String email) {
        Member member = memberRepository.findByEmail(email).orElseThrow();
        Comment comment = commentRepository.findById(commentId).orElseThrow();

        // ???????????? ?????? ?????? ?????? ?????? ????????? ??? ???????????? ??????
        if (comment.getMember() == member || comment.getBoard().getMember() == member ) {

            // ?????? ??????
            // ?????? ????????? ??????
            commentLikeRepository.deleteByCommentAndMember(comment, member);
            // ?????? ??????
            commentRepository.delete(comment);

            // ????????? ??????
            List<Comment> reComments = commentRepository.findByParentId(commentId, Sort.by(Sort.Direction.ASC, "createdDateTime"));
            List<CommentLike> reCommentLikes = commentLikeRepository.findByCommentIn(reComments);

            if (!reCommentLikes.isEmpty()) {
                for (CommentLike reCommentLike : reCommentLikes) {
                    commentLikeRepository.delete(reCommentLike);
                }
            }


            if (!reComments.isEmpty()) {
                for (Comment reComment : reComments) {
                    commentRepository.delete(reComment);
                }
            }

        }
    }


    // ????????? ?????? ??????
    @Override
    public MemberDto getUserInfoByUserId(String userId, String loginEmail) {

        Member member = memberRepository.findByNickname(userId).orElseThrow();
        Member loginMember = memberRepository.findByEmail(loginEmail).orElseThrow();
        MemberDto memberDto = new MemberDto();
        memberDto.setFollow(followRepository.existsByFollowerMemberIdAndFollowingMemberId(loginMember.getMemberId(), member.getMemberId()));
        memberDto.setUser(boardDtoCreator.setUserDto(member));

        List<Board> boards = boardRepository.findByMember(member, Sort.by(Sort.Direction.DESC, "createdDateTime"));
        List<BoardDto> boardDtos = new ArrayList<>();

        for (Board board : boards) {
            if (board.getIsDelete() != 0) continue;
            // ????????? Dto ??????
            BoardDto boardDto = boardDtoCreator.startDto(board, member);
            boardDto.setCreateUser(boardDtoCreator.toCreateUser(board, member));

            // List add
            boardDtos.add(boardDto);
        }
        memberDto.setBoards(boardDtos);

        List<BoardScrap> scraps = boardScrapRepository.findByMember(member, Sort.by(Sort.Direction.DESC, "boardScrapId"));
        List<BoardDto> scrapDtos = new ArrayList<>();

        for (BoardScrap scrap : scraps) {
            Board board = scrap.getBoard();
            if (board.getIsDelete() != 0) continue;
            if (board.getMember() == member) continue;
            if (reportRepository.existsByBoardAndMember(board, member)) continue;

            BoardDto scrapDto = boardDtoCreator.startDto(board, member);
            scrapDto.setCreateUser(boardDtoCreator.toCreateUser(board, member));

            // List add
            scrapDtos.add(scrapDto);
        }

        memberDto.setScraps(scrapDtos);

        return memberDto;
    }

    // ????????? ?????????
    @Override
    public Boolean boardScrapCancle(Long boardId, String email) {
        Board board = boardRepository.findById(boardId).orElseThrow();
        Member member = memberRepository.findByEmail(email).orElseThrow();

        boolean isScrap = boardScrapRepository.existsByBoardAndMember(board, member);

        if (!isScrap) {
            BoardScrap boardScrap = BoardScrap.builder().board(board).member(member).build();
            boardScrapRepository.save(boardScrap);

            return true;
        } else {
            boardScrapRepository.deleteByBoardAndMember(board, member);
            return false;
        }

    }

    // ????????? ????????????
    public Boolean boardReport(Long boardId, Integer content, String email) {
        Board board = boardRepository.findById(boardId).orElseThrow();
        Member member = memberRepository.findByEmail(email).orElseThrow();

        Long reportCount = reportRepository.countByBoard(board);

//        List<Report> boardList = reportRepository.findAllByBoard(board);
//        int boardListLength = boardList.size();

        if (board.getMember() == member) {
            return Boolean.FALSE;
        }

        Report report = reportRepository.findByBoardAndMember(board, member).orElse(null);

        if (reportCount >= 9) {
            board.setIsDelete(2);
        }

        if (report == null) {
            Report reportCreate = Report.builder().board(board).member(member).content(content).flag(0).build();

            reportRepository.save(reportCreate);

            return Boolean.TRUE;
        } else {
            return Boolean.FALSE;
        }
    }

}
