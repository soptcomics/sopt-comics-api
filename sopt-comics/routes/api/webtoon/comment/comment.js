const express = require('express')
const router = express.Router({mergeParams: true})

const UTILS = require('../../../../modules/utils/utils')
const CODE = require('../../../../modules/utils/statusCode')
const MSG = require('../../../../modules/utils/responseMessage')
const upload = require('../../../../config/multer')
const authUtils = require('../../../../modules/utils/authUtils')
const Comment = require('../../../../models/Comment')
const User = require('../../../../models/User')
const Episode = require('../../../../models/Episode')

/*
댓글 전체 읽기
METHOD      : GET
URL         : /webtoon/comics/episodes/:episodeIdx/comment
PARAMETER   : episodeIdx = Episode'sindex
*/
router.get('/', async (req, res) => {
    const inputEpisodeIdx = req.params.episodeIdx
    if(inputEpisodeIdx == undefined){
        res.status(200).send(UTILS.successFalse(CODE.BAD_REQUEST, MSG.FAIL_READ_COMMENTS_ALL))
        return
    }
    const existEpisode = await Episode.selectEpisode({episodeIdx: inputEpisodeIdx})
    if(existEpisode.isError == true) {
        res.status(200).send(existEpisode.jsonData)
        return
    }
    if(existEpisode.length == 0) {
        res.status(200).send(UTILS.successFalse(CODE.BAD_REQUEST, MSG.NO_EPISODE))
        return
    }
    const result = await Comment.selectCommentsAll({episodeIdx: inputEpisodeIdx})
    if (result === undefined){        
        res.status(200).send(UTILS.successFalse(CODE.BAD_REQUEST, MSG.FAIL_READ_COMMENTS_ALL))
        return
    }
    res.status(200).send(UTILS.successTrue(CODE.OK, MSG.READ_COMMENTS_ALL, result))
})

/*
댓글 쓰기
METHOD      : POST
URL         : /webtoon/comics/episodes/:episode_idx/comment
BODY        : {
    "name": "이름", // nullable, 익명 댓글 이름
    "image1": "이미지1", //nullable
    "image2": "이미지2",
    "image3": "이미지3",
    "image4": "이미지4",
    "episode_idx": 1,
    "user_idx": 3 //nullable 
}
*/
router.post('/', upload.array('image'), authUtils.isLoggedin, async (req, res) => {
    if (req.files.length > 4) {
        res.status(200).send(UTILS.successFalse(CODE.BAD_REQUEST, OUT_OF_IMAGE_LIMIT_4))
        return
    }
    const inputImage = [null, null, null, null]
    for(let i = 0; i < req.files.length; i++){
        inputImage[i] = req.files[i].location
    }
    const inputThumbnail = inputImage[0]
    const inputImage1 = inputThumbnail
    const inputImage2 = inputImage[1]
    const inputImage3 = inputImage[2]
    const inputImage4 = inputImage[3]
    const inputUserIdx = req.decoded.userIdx || null
    let inputName = req.body.name
    const inputContent = req.body.content
    const inputEpisodeIdx = req.params.episodeIdx
    if (inputThumbnail == undefined) {
        res.status(200).send(UTILS.successFalse(CODE.BAD_REQUEST, MSG.OUT_OF_VALUE))
        return
    }
    if(!inputName && inputUserIdx) {
        const resultUser = await User.selectUser({userIdx: inputUserIdx})
        if(resultUser.isError == true){
            res.status(200).send(result.jsonData)
            return
        }
        inputName = resultUser.name
    }
    if (inputName == undefined ||
        inputContent == undefined ||
        inputEpisodeIdx == undefined) {
        res.status(200).send(UTILS.successFalse(CODE.BAD_REQUEST, MSG.OUT_OF_VALUE))
        return
    }
    const existEpisode = await Episode.selectEpisode({episodeIdx : inputEpisodeIdx})
    if(existEpisode.isError == true) {
        res.status(200).send(existEpisode.jsonData)
        return
    }
    if(existEpisode.length == 0) {
        res.status(200).send(UTILS.successFalse(CODE.BAD_REQUEST, MSG.NO_EPISODE))
        return
    }
    const comment = new Comment(inputName, inputContent, inputImage1, inputImage2, inputImage3, inputImage4, inputEpisodeIdx, inputUserIdx)
    const result = await comment.insertComments()
    if(result.isError == true){
        res.status(200).send(result.jsonData)
        return
    }
    res.status(200).send(UTILS.successTrue(CODE.OK, MSG.CREATED_COMMENTS))
})
module.exports = router
